# Task Assignment Hook Implementation (FAB-126)

## Overview

The `useTaskAssignment` hook provides a comprehensive solution for task-to-agent assignment with capacity validation, optimistic updates, and error handling. It integrates seamlessly with TanStack Query for state management and caching.

## Hook Location

- **File**: `src/hooks/useTaskAssignment.ts`
- **Exports**: `useTaskAssignment`, type definitions for assignment operations

## Core Features

### 1. Task Assignment

Assign tasks to agents with validation and optimistic updates:

```typescript
const { assign, assignAsync } = useTaskAssignment()

// Using mutate (fire-and-forget)
assign({ taskId: '1', agentId: 'agent-1' })

// Using mutateAsync (promise-based)
await assignAsync({ taskId: '1', agentId: 'agent-1' })
```

**API Endpoint**: `POST /api/tasks/:id/assign`

**Payload**:
```json
{
  "agentId": "agent-1"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Task title",
    "assignee": "agent-1",
    "status": "backlog",
    "priority": "high",
    "storyPoints": 8,
    "sprint": "sprint-1",
    "order": 1,
    "estimatedHours": 16,
    "createdAt": "2026-03-07T...",
    "updatedAt": "2026-03-07T..."
  },
  "message": "Task assigned to Carlos",
  "timestamp": "2026-03-07T..."
}
```

### 2. Task Unassignment

Remove task assignment from agents:

```typescript
const { unassign, unassignAsync } = useTaskAssignment()

// Using mutate (fire-and-forget)
unassign({ taskId: '1' })

// Using mutateAsync (promise-based)
await unassignAsync({ taskId: '1' })
```

**API Endpoint**: `POST /api/tasks/:id/unassign`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Task title",
    "assignee": "",
    "status": "backlog",
    "priority": "high",
    "storyPoints": 8,
    "sprint": "sprint-1",
    "order": 1,
    "estimatedHours": 16,
    "createdAt": "2026-03-07T...",
    "updatedAt": "2026-03-07T..."
  },
  "message": "Task unassigned from agent agent-1",
  "timestamp": "2026-03-07T..."
}
```

### 3. Agent Capacity Checking

Check agent workload and availability:

```typescript
const { checkAgentCapacity } = useTaskAssignment()

const capacity = await checkAgentCapacity('agent-1')
// {
//   agentId: 'agent-1',
//   currentTasks: 5,
//   maxTasks: 10,
//   available: true,
//   workload: 'medium'
// }
```

**API Endpoint**: `GET /api/agents/availability`

**Response**:
```json
{
  "success": true,
  "data": {
    "agent-1": {
      "currentTasks": 5,
      "maxTasks": 10,
      "workload": "medium"
    }
  }
}
```

## Optimistic Updates

The hook implements immediate UI updates before server confirmation:

```typescript
const { assign } = useTaskAssignment({
  onAssignSuccess: (data) => console.log('Assigned:', data),
})

// 1. UI updates immediately with optimistic data
// 2. Request sent to server in background
// 3. On success: server data reflected in cache
// 4. On error: UI reverts to previous state automatically
assign({ taskId: '1', agentId: 'agent-1' })
```

### How It Works

1. **Before Assignment**: Hook snapshots current task data
2. **Optimistic Update**: UI updates with `assignee` set to new agent
3. **Server Request**: Assignment mutation sent to backend
4. **On Success**: Cache updated with server response, related queries invalidated
5. **On Error**: Cache reverted to previous snapshot, error callback triggered

## Query Integration

### Query Keys

The hook manages these query keys:

- **Task-specific**: `['tasks', taskId]`
- **Task assignment**: `['tasks', taskId, 'assignment']`
- **Task list**: `['tasks']`
- **Agent workload**: `['agent-workload', agentId]`
- **Agent data**: `['agents', agentId]`
- **Agent availability**: `['agents', 'availability']`

### Cache Invalidation

On successful assignment/unassignment, these queries are invalidated:

```typescript
// Specific task query
queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })

// Task list (affects tables, dashboards)
queryClient.invalidateQueries({ queryKey: ['tasks'] })

// Agent-specific queries
queryClient.invalidateQueries({ queryKey: ['agent-workload', agentId] })
queryClient.invalidateQueries({ queryKey: ['agents', agentId] })

// Agent availability (global capacity info)
queryClient.invalidateQueries({ queryKey: ['agents', 'availability'] })
```

## Capacity Validation

### Configuration

```typescript
const { assign } = useTaskAssignment({
  maxTasksPerAgent: 10,        // Default: 10
  validateCapacity: true,       // Default: true
})
```

### Validation Logic

- **Pre-request**: Hook validates agent state in cache
- **Server-side**: MSW handler checks agent workload
- **Response**: Error with capacity details on failure

### Error Response

When capacity is exceeded:

```json
{
  "success": false,
  "error": "Agent Carlos is at maximum capacity",
  "code": "CAPACITY_EXCEEDED",
  "conflictDetails": {
    "agentId": "agent-1",
    "currentTaskCount": 10,
    "maxCapacity": 10
  }
}
```

## Callbacks and Error Handling

### Success Callbacks

```typescript
const { assign } = useTaskAssignment({
  onAssignSuccess: (data: AssignmentResult) => {
    console.log(`Assigned to ${data.data.assignee}`)
    toast.success(data.message)
  },

  onUnassignSuccess: (data: UnassignmentResult) => {
    console.log('Task unassigned')
    toast.success(data.message)
  },
})
```

### Error Callbacks

```typescript
const { assign } = useTaskAssignment({
  onAssignError: (error: AssignmentError | Error) => {
    if ('error' in error) {
      // AssignmentError
      console.error(`Assignment failed: ${error.error}`)
      if (error.conflictDetails) {
        console.error(`Agent has ${error.conflictDetails.currentTaskCount}/${error.conflictDetails.maxCapacity} tasks`)
      }
    } else {
      // Generic Error
      console.error('Network error:', error.message)
    }
  },

  onUnassignError: (error: AssignmentError | Error) => {
    console.error('Unassignment failed:', error)
  },
})
```

## Component Integration

### Basic Usage

```typescript
import { useTaskAssignment } from '@/hooks'
import type { Task } from '@/types/task'

interface TaskAssignmentButtonProps {
  task: Task
}

export function TaskAssignmentButton({ task }: TaskAssignmentButtonProps) {
  const { assign, assignmentPending, assignmentError } = useTaskAssignment({
    onAssignSuccess: () => {
      // UI automatically updated via cache
    },
    onAssignError: (error) => {
      if ('error' in error) {
        alert(`Cannot assign: ${error.error}`)
      }
    },
  })

  return (
    <div>
      <button
        onClick={() => assign({ taskId: task.id, agentId: 'agent-1' })}
        disabled={assignmentPending || !task.id}
      >
        {assignmentPending ? 'Assigning...' : 'Assign Task'}
      </button>
      {assignmentError && (
        <p className="text-red-600">
          Error: {assignmentError instanceof Error ? assignmentError.message : 'Unknown error'}
        </p>
      )}
    </div>
  )
}
```

### With Agent Selection

```typescript
export function TaskAssignmentForm({ task }: { task: Task }) {
  const { assign, assignmentPending } = useTaskAssignment()
  const { data: agents } = useAgents()
  const [selectedAgent, setSelectedAgent] = useState('')

  const handleAssign = async () => {
    if (!selectedAgent) return

    try {
      await assign({ taskId: task.id, agentId: selectedAgent })
    } catch (error) {
      console.error('Assignment failed:', error)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleAssign() }}>
      <select
        value={selectedAgent}
        onChange={(e) => setSelectedAgent(e.target.value)}
        disabled={assignmentPending}
      >
        <option value="">Select agent...</option>
        {agents?.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={assignmentPending || !selectedAgent}>
        {assignmentPending ? 'Assigning...' : 'Assign'}
      </button>
    </form>
  )
}
```

### Table Integration

```typescript
export function TaskTable() {
  const { data: tasks } = useTasks()
  const { assign, unassign, isPending } = useTaskAssignment()

  return (
    <table>
      <tbody>
        {tasks?.map((task) => (
          <tr key={task.id}>
            <td>{task.title}</td>
            <td>{task.assignee || 'Unassigned'}</td>
            <td>
              {task.assignee ? (
                <button
                  onClick={() => unassign({ taskId: task.id })}
                  disabled={isPending}
                >
                  Unassign
                </button>
              ) : (
                <button
                  onClick={() => assign({ taskId: task.id, agentId: 'agent-1' })}
                  disabled={isPending}
                >
                  Assign
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## MSW Handler Details

### Assignment Endpoint

**Handler**: `POST /api/tasks/:id/assign`

Logic:
1. Find task by ID
2. Find agent by ID
3. Check if task already assigned
4. Check agent workload (max 10 concurrent tasks)
5. Warn if junior agent assigned to high-priority task
6. Update task with new assignee
7. Return updated task

### Unassignment Endpoint

**Handler**: `POST /api/tasks/:id/unassign`

Logic:
1. Find task by ID
2. Verify task is assigned
3. Clear assignee
4. Generate timestamp
5. Return updated task

### Capacity Endpoint

**Handler**: `GET /api/agents/availability`

Response includes:
- Current task count per agent
- Max capacity (10 tasks)
- Workload status: 'low' | 'medium' | 'high' | 'overloaded'

## TypeScript Types

### AssignmentResult

```typescript
interface AssignmentResult {
  success: boolean
  data: Task
  message: string
  timestamp: string
}
```

### AssignmentError

```typescript
interface AssignmentError {
  success: false
  error: string
  code?: string
  conflictDetails?: {
    agentId: string
    currentTaskCount: number
    maxCapacity: number
  }
}
```

### AgentCapacityInfo

```typescript
interface AgentCapacityInfo {
  agentId: string
  currentTasks: number
  maxTasks: number
  available: boolean
  workload: 'low' | 'medium' | 'high' | 'overloaded'
}
```

## Success Criteria

- ✅ Hook prevents assignments exceeding agent capacity (max 10 tasks)
- ✅ Optimistic updates show assignment immediately in UI
- ✅ Failed assignments roll back UI state automatically
- ✅ Clear error messages for assignment conflicts
- ✅ Full TypeScript support for all operations
- ✅ Consistent query cache management across related queries
- ✅ Proper timestamp generation in responses
- ✅ Support for both unassigned and assigned task validation

## Testing Scenarios

### Successful Assignment

1. Task is unassigned, agent has capacity
2. Call `assign({ taskId: '3', agentId: 'agent-1' })`
3. UI shows assignment immediately (optimistic)
4. Server confirms with task update
5. Related queries invalidated and refreshed

### Capacity Exceeded

1. Agent already has 10 tasks
2. Call `assign({ taskId: '3', agentId: 'agent-1' })`
3. Server returns error: "Agent is at maximum capacity"
4. UI reverts optimistic update
5. Error callback triggered

### Unassignment

1. Task is assigned to agent
2. Call `unassign({ taskId: '1' })`
3. UI immediately shows assignee as empty
4. Server confirms unassignment
5. Agent workload queries updated

## Query Key Reference

When implementing related components, use these query keys for consistency:

```typescript
// Single task
['tasks', taskId]

// Task assignment details
['tasks', taskId, 'assignment']

// All tasks (filtered queries)
['tasks']
['tasks/queue']

// Agent workload
['agent-workload', agentId]
['agent-workload-list', agentIds]

// Agent details
['agents', agentId]
['agents']

// Availability/capacity
['agents', 'availability']
```
