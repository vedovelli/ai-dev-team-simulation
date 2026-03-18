# Agent Activity Hook Implementation Guide

## Overview

The `useAgentActivity` hook provides a focused data layer for fetching agent event logs with time-range filtering and cursor-based pagination. This guide covers pagination patterns, query key strategy, and integration with mutations.

## Hook Signature

```typescript
function useAgentActivity(
  agentId: string,
  options?: {
    timeRange?: '7d' | '30d' | { from: Date; to: Date }
    pageSize?: number
  }
): UseAgentActivityReturn
```

## Basic Usage

```typescript
import { useAgentActivity } from '@/hooks'

function AgentActivityList({ agentId }: { agentId: string }) {
  const { events, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useAgentActivity(
    agentId,
    {
      timeRange: '7d',
      pageSize: 20,
    }
  )

  if (isLoading) return <div>Loading activity...</div>

  return (
    <div>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            <div className="event-type">{event.type}</div>
            <div className="description">{event.description}</div>
            <div className="timestamp">{new Date(event.timestamp).toLocaleString()}</div>
            <div className="related-entity">Related to: {event.relatedEntityId}</div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## Cursor-Based Pagination Pattern

This hook uses cursor-based pagination instead of offset/limit pagination. This approach is more efficient for large datasets and handles concurrent updates better.

### How It Works

1. **Initial Request**: No cursor provided, returns first page of events
2. **Cursor Generation**: Each page response includes a `nextCursor` (null if no more pages)
3. **Next Page Request**: Client sends `cursor` to get the next batch
4. **Efficient Fetching**: Server uses cursor to find starting position and returns `pageSize` events

### Query Response Structure

```typescript
interface PaginatedActivityResponse {
  events: ActivityEvent[] // Page of events sorted by timestamp desc
  nextCursor: string | null // Cursor for next page, null if no more pages
  hasMore: boolean // Indicates if more events exist
}
```

### Infinite Scroll Example

```typescript
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll' // Hypothetical intersection observer hook

function AgentActivityScroll({ agentId }: { agentId: string }) {
  const { events, fetchNextPage, hasNextPage } = useAgentActivity(agentId)
  const { ref } = useInfiniteScroll({
    onIntersect: () => {
      if (hasNextPage) {
        fetchNextPage()
      }
    },
  })

  return (
    <div>
      {events.map((event) => (
        <ActivityEventCard key={event.id} event={event} />
      ))}
      {hasNextPage && <div ref={ref}>Loading...</div>}
    </div>
  )
}
```

## Time-Range Filtering

The hook supports three approaches to time-range filtering:

### 1. Predefined Time Ranges

```typescript
// Last 7 days (default)
const { events } = useAgentActivity(agentId, { timeRange: '7d' })

// Last 30 days
const { events } = useAgentActivity(agentId, { timeRange: '30d' })
```

### 2. Custom Date Range

```typescript
const { events } = useAgentActivity(agentId, {
  timeRange: {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31'),
  },
})
```

### 3. Dynamic Time Range

```typescript
const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

const { events } = useAgentActivity(agentId, { timeRange })

// When filter changes, query automatically refetches
const handleTimeRangeChange = (newRange: '7d' | '30d') => {
  setTimeRange(newRange)
}
```

## Query Key Strategy

The hook uses a hierarchical query key structure to ensure proper cache invalidation:

```typescript
// Full query key includes agentId and normalized timeRange
['agent-activity', { agentId: 'agent-1' }, { timeRange: '7d' }]

// Related keys for invalidation
['agent-activity', { agentId: 'agent-1' }] // All pages for this agent
['agent-activity'] // All agent activity queries
```

### Key Structure Breakdown

- **Root**: `['agent-activity']` — All activity queries
- **Agent**: `['agent-activity', { agentId }]` — All pages for one agent
- **Filtered**: `['agent-activity', { agentId }, { timeRange }]` — Specific filtered view

## Cache Invalidation on Mutations

The hook integrates with task and assignment mutations to keep activity cache fresh. When these mutations complete successfully, related activity caches are invalidated:

### Automatic Invalidation

Task mutations automatically invalidate agent activity cache:

```typescript
// In useUpdateTask, useCompleteTask, useReassignTask, etc.
onSuccess: (updatedTask) => {
  // Invalidate activity cache for affected agents
  queryClient.invalidateQueries({
    queryKey: agentActivityQueryKeys.all,
  })
}
```

### Manual Invalidation

You can also manually invalidate when needed:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { agentActivityQueryKeys } from '@/hooks/useAgentActivity'

function MyComponent() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    // Invalidate all activity for one agent
    queryClient.invalidateQueries({
      queryKey: agentActivityQueryKeys.list('agent-1'),
    })

    // Or invalidate all agent activity
    queryClient.invalidateQueries({
      queryKey: agentActivityQueryKeys.all,
    })
  }

  return <button onClick={handleRefresh}>Refresh Activity</button>
}
```

## Event Type Reference

The hook returns events with the following type structure:

```typescript
type ActivityEventType =
  | 'task_assigned' // Task assigned to this agent
  | 'task_completed' // Task marked as complete
  | 'task_status_changed' // Task status changed
  | 'task_comment' // New comment on task
  | 'assignment_changed' // Task reassigned between agents

interface ActivityEvent {
  id: string // Unique event ID
  type: ActivityEventType // Event classification
  description: string // Human-readable event description
  timestamp: string // ISO 8601 timestamp
  relatedEntityId: string // ID of related entity (task, sprint, etc)
}
```

## Performance Considerations

### Page Size
The default page size is 20 events per request. Adjust based on your UI:

```typescript
// Smaller pages for mobile
const { events } = useAgentActivity(agentId, { pageSize: 10 })

// Larger pages for desktop infinite scroll
const { events } = useAgentActivity(agentId, { pageSize: 50 })
```

### Stale Time
By default, activity data becomes stale after 30 seconds and is garbage collected after 5 minutes. This is appropriate for activity logs that don't require real-time updates:

```typescript
// The hook configuration (read-only, built-in):
// staleTime: 30 * 1000 (30 seconds)
// gcTime: 5 * 60 * 1000 (5 minutes)
```

### Retry Logic
Failed requests are retried up to 3 times with exponential backoff:

```typescript
// Retry delays: 1s, 2s, 4s, then give up
// Built into the hook automatically
```

## Testing

### Mock Setup
The hook uses MSW with pre-generated activity data:

```typescript
// In your test setup
import { agentActivityHandlers } from '@/mocks/handlers/agent-activity'

// agentActivityHandlers are registered with MSW
server.use(...agentActivityHandlers)
```

### Example Test

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentActivity } from '@/hooks'

describe('useAgentActivity', () => {
  it('should fetch activity for an agent', async () => {
    const { result } = renderHook(() => useAgentActivity('agent-1'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events.length).toBeGreaterThan(0)
    expect(result.current.events[0]).toHaveProperty('id')
    expect(result.current.events[0]).toHaveProperty('type')
  })

  it('should support pagination', async () => {
    const { result } = renderHook(() => useAgentActivity('agent-1', { pageSize: 10 }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const firstPageCount = result.current.events.length

    if (result.current.hasNextPage) {
      act(() => {
        result.current.fetchNextPage()
      })

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(firstPageCount)
      })
    }
  })

  it('should filter by time range', async () => {
    const { result } = renderHook(() => useAgentActivity('agent-1', { timeRange: '30d' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // All events should be within the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    result.current.events.forEach((event) => {
      expect(new Date(event.timestamp)).toBeGreaterThanOrEqual(thirtyDaysAgo)
    })
  })
})
```

## Integration with Dashboard Components

### Complete Dashboard Example

```typescript
import { useAgentActivity } from '@/hooks'
import { ActivityTimeline } from '@/components/ActivityTimeline'

function AgentDashboard({ agentId }: { agentId: string }) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')

  const { events, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useAgentActivity(
    agentId,
    { timeRange }
  )

  return (
    <div className="dashboard">
      <div className="filters">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as '7d' | '30d')}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {isLoading && <div>Loading activity...</div>}

      {!isLoading && events.length === 0 && <div>No activity in this period</div>}

      {events.length > 0 && (
        <>
          <ActivityTimeline events={events} />

          {hasNextPage && (
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading More...' : 'Load More Activity'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
```

## Future Extensions

This hook is intentionally kept simple and focused. Future sprints might add:

- **Parallel Metrics Computation**: Computing concurrent metrics alongside activity fetching
- **Real-time Updates**: WebSocket integration for live activity updates
- **Filtering by Event Type**: Client-side filtering for specific activity types
- **Activity Grouping**: Temporal grouping (by hour, day, week) for better visualization

For now, the hook successfully demonstrates TanStack Query pagination and filtering patterns cleanly.
