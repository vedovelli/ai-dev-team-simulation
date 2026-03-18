# Agent Availability Implementation Guide

## Overview

This guide demonstrates the agent availability feature for schedule-based availability tracking, blackout periods management, and capacity planning with time-range queries.

## Core Concepts

### Availability Windows
Agents have regular availability patterns defined as weekly recurring windows:
- Day of week (Monday-Sunday)
- Start and end hours (24-hour format)
- Example: Monday-Friday, 9-17 (standard business hours)

### Blackout Periods
Agents can have scheduled unavailability periods for:
- Vacation
- Sick leave
- Training
- Other commitments
- Specified with inclusive date range and reason

### Current Capacity
Tracks an agent's workload:
- `assigned`: Number of currently assigned tasks
- `max`: Maximum capacity (typically 10 tasks)

## API Endpoints

### Get Agent Availability
```
GET /api/agents/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
```

**Query Parameters:**
- `from`: ISO date string (inclusive)
- `to`: ISO date string (inclusive)

**Response:**
```json
{
  "agentId": "agent-1",
  "availabilityWindows": [
    { "dayOfWeek": "monday", "startHour": 9, "endHour": 17 },
    { "dayOfWeek": "tuesday", "startHour": 9, "endHour": 17 }
  ],
  "blackoutPeriods": [
    {
      "startDate": "2024-03-15",
      "endDate": "2024-03-22",
      "reason": "Vacation"
    }
  ],
  "currentCapacity": {
    "assigned": 5,
    "max": 10
  }
}
```

## Usage Patterns

### Basic Hook Usage

```typescript
import { useAgentAvailability } from '../hooks'
import type { DateRange } from '../types/agent-availability'

function AgentAvailabilityDisplay({ agentId }: { agentId: string }) {
  const dateRange: DateRange = {
    from: '2024-03-01',
    to: '2024-03-31'
  }

  const { data, isLoading, isAvailable } = useAgentAvailability(agentId, dateRange)

  if (isLoading) return <div>Loading...</div>

  // Check availability on a specific date
  const deadline = new Date('2024-03-15')
  const isAvailableOnDeadline = isAvailable(deadline)

  return (
    <div>
      <h2>{data?.agentId}</h2>
      <p>Capacity: {data?.currentCapacity.assigned}/{data?.currentCapacity.max}</p>
      <p>Available on deadline: {isAvailableOnDeadline ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

### Integration with Task Assignment

When assigning a task with a deadline, check the agent's availability to warn the user:

```typescript
import { useTaskAssignment } from '../hooks'
import { useAgentAvailability } from '../hooks'
import type { DateRange } from '../types/agent-availability'

interface TaskAssignmentWithAvailabilityProps {
  taskId: string
  agentId: string
  deadline?: string // ISO date string
}

function TaskAssignmentWithAvailability({
  taskId,
  agentId,
  deadline
}: TaskAssignmentWithAvailabilityProps) {
  const { assign, isPending } = useTaskAssignment({
    onAssignSuccess: () => {
      showToast.success('Task assigned')
    }
  })

  // Set up date range for availability check (30 days)
  const now = new Date()
  const dateRange: DateRange = {
    from: now.toISOString().split('T')[0],
    to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  }

  const { data: availability, isAvailable } = useAgentAvailability(
    agentId,
    dateRange
  )

  const handleAssign = async () => {
    // Check availability if task has a deadline
    if (deadline && availability) {
      const deadlineDate = new Date(deadline)
      const availableOnDeadline = isAvailable(deadlineDate)

      if (!availableOnDeadline) {
        // Non-blocking warning - still allow assignment
        showToast.warning(
          `Agent is unavailable on ${deadline}. Continue with assignment?`
        )
      }
    }

    // Proceed with assignment
    await assign({ taskId, agentId })
  }

  return (
    <button onClick={handleAssign} disabled={isPending}>
      Assign Task
    </button>
  )
}
```

### Checking Multiple Dates

```typescript
function TasksWithAvailabilityCheck({
  agentId,
  tasks
}: {
  agentId: string
  tasks: Array<{ id: string; deadline?: string }>
}) {
  // Set up date range to cover all task deadlines
  const dates = tasks
    .map((t) => t.deadline)
    .filter((d): d is string => !!d)

  if (dates.length === 0) return <div>No tasks with deadlines</div>

  const minDate = new Date(Math.min(...dates.map((d) => new Date(d).getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => new Date(d).getTime())))

  const dateRange: DateRange = {
    from: minDate.toISOString().split('T')[0],
    to: new Date(maxDate.getTime() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  }

  const { isAvailable } = useAgentAvailability(agentId, dateRange)

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>
          <h3>{task.id}</h3>
          {task.deadline && (
            <p>
              Available: {isAvailable(new Date(task.deadline)) ? '✓' : '✗'}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
```

## Cache Behavior

### Query Key Structure
```typescript
['agents', agentId, 'availability', { from, to }]
```

### Cache Configuration
- **Stale Time**: 60 seconds (availability changes infrequently)
- **GC Time**: 5 minutes
- **Refetch**: On reconnect, not on window focus
- **Retry**: 3 attempts with exponential backoff

### Invalidation
When task assignments change, related queries are invalidated:
```typescript
queryClient.invalidateQueries({
  queryKey: ['agents', agentId, 'availability']
})
```

## Helper Function

The `isAvailable()` function returned from the hook handles:
1. **Blackout Period Check**: Returns false if date falls within any blackout period
2. **Weekly Pattern Check**: Returns false if date's day of week isn't in availability windows
3. **Hour Check**: Returns false if date's hour isn't within the day's availability window

```typescript
const isAvailableOnDeadline = isAvailable(deadlineDate)
// Returns true only if:
// - Not in a blackout period AND
// - Day of week has an availability window AND
// - Hour is within that window
```

## Error Handling

The hook includes automatic retry logic with exponential backoff:
- Max 3 retry attempts
- 1s → 2s → 4s delays
- Exponential backoff caps at 30 seconds

```typescript
const { error, isLoading } = useAgentAvailability(agentId, dateRange)

if (error) {
  // Handle error - show user-friendly message
  return <div>Failed to load agent availability</div>
}
```

## Testing

### Mock Data
The MSW handler generates realistic mock data:
- **Standard Hours**: Mon-Fri, 9-17
- **Vacation**: ~33% of agents have 5-day vacation periods
- **Sick Leave**: ~20% of agents have 1-2 day sick leave
- **Capacity**: Random 0-7 assigned tasks out of 10 max

### Manual Testing
1. Open dev tools Network tab
2. Trigger agent availability fetch
3. Verify date range parameters are sent
4. Check response includes availability windows and blackout periods

```javascript
// In browser console
fetch('/api/agents/agent-1/availability?from=2024-03-01&to=2024-03-31')
  .then(r => r.json())
  .then(d => console.log(d))
```

## Performance Considerations

### Query Efficiency
- Single query per agent per date range
- No automatic polling (60s stale time prevents excessive fetches)
- Date range should be reasonable (typically 30-90 days)

### Avoid N+1 Queries
```typescript
// ✗ Bad - multiple queries for single agent
agents.forEach(agent => {
  const { isAvailable } = useAgentAvailability(agent.id, dateRange)
})

// ✓ Good - single query per agent with caching
const { isAvailable } = useAgentAvailability(targetAgentId, dateRange)
```

## Related Hooks

- **useTaskAssignment**: Task assignment mutations with capacity validation
- **useNotifications**: Real-time task assignment notifications
- **useAgents**: General agent information and status
