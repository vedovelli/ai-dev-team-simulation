# Activity Feed Hook — Implementation Guide

## Overview

The `useActivityFeed` hook provides a cursor-based paginated interface for fetching sprint-level activities. It's built on TanStack Query's `useInfiniteQuery` for efficient client-side pagination without re-fetching entire history.

## Key Features

- **Cursor-based pagination**: Avoids re-fetching entire history on each new page
- **Entity filtering**: Filter by entity type (sprint, task, agent) and entity ID
- **Auto-polling**: Configurable polling interval (default: 30s) with window focus refetch
- **Selective cache invalidation**: Invalidate only affected entity feeds, not all activity
- **Stale-while-revalidate strategy**: 15s stale time, 2min gc time

## API

### Hook Signature

```typescript
useActivityFeed(options?: UseActivityFeedOptions)
```

### Options

```typescript
interface UseActivityFeedOptions {
  sprintId?: string        // Sprint ID (shorthand for entityType='sprint')
  entityType?: EntityType  // 'sprint' | 'task' | 'agent'
  entityId?: string        // Entity ID to filter activities
  limit?: number           // Events per page (default: 50)
  pollingInterval?: number // Polling interval in ms (default: 30000)
}
```

### Return Value

Standard TanStack Query `UseInfiniteQueryResult`:

```typescript
{
  data: {
    pages: Array<{
      events: ActivityEvent[]
      nextCursor: string | null
      hasMore: boolean
    }>
    pageParams: unknown[]
  }
  fetchNextPage: () => Promise<...>
  fetchPreviousPage: () => Promise<...>
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
  // ... other query state
}
```

## Usage Examples

### Basic: Fetch Sprint Activities

```tsx
function SprintActivityFeed({ sprintId }: { sprintId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useActivityFeed({ sprintId })

  return (
    <div>
      {isLoading && <div>Loading...</div>}

      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.events.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          Load more activities
        </button>
      )}
    </div>
  )
}
```

### With Virtual Scrolling

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualActivityFeed({ sprintId }: { sprintId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
  } = useActivityFeed({ sprintId, limit: 100 })

  // Flatten pages into single array
  const events = data?.pages.flatMap(p => p.events) ?? []

  const virtualizer = useVirtualizer({
    count: hasNextPage ? events.length + 1 : events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse()
    if (!lastItem) return

    if (lastItem.index >= events.length - 1 && hasNextPage) {
      fetchNextPage()
    }
  }, [virtualItems, fetchNextPage, hasNextPage, events.length])

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualItems.map((virtualItem) => (
          <div key={virtualItem.key} style={...}>
            {events[virtualItem.index] && (
              <ActivityItem event={events[virtualItem.index]} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Entity-Specific Feeds

```tsx
// Task-specific activity
const taskFeed = useActivityFeed({
  entityType: 'task',
  entityId: 'task-123',
  limit: 30,
})

// Agent-specific activity
const agentFeed = useActivityFeed({
  entityType: 'agent',
  entityId: 'agent-alpha',
})
```

## Cache Invalidation

### Invalidate on Mutations

After mutations (task assignment, status change, comment), invalidate the affected feed:

```typescript
// In useUpdateTask mutation:
const queryClient = useQueryClient()

useMutation({
  mutationFn: updateTask,
  onSuccess: (task) => {
    // Invalidate task's activity feed
    queryClient.invalidateQueries({
      queryKey: queryKeys.activity.feed('task', task.id)
    })

    // Invalidate sprint-level feed
    queryClient.invalidateQueries({
      queryKey: queryKeys.activity.feed('sprint', task.sprintId)
    })
  }
})
```

### Append Events Optimistically

For better UX, append new events without full refetch:

```typescript
const queryClient = useQueryClient()

// In mutation onSuccess:
queryClient.setQueryData(
  queryKeys.activity.feed('sprint', sprintId),
  (old) => {
    if (!old) return { pages: [], pageParams: [] }

    return {
      ...old,
      pages: [
        {
          ...old.pages[0],
          events: [newEvent, ...old.pages[0].events],
        },
        ...old.pages.slice(1),
      ],
    }
  }
)
```

## Event Types

### ActivityEvent Interface

```typescript
interface ActivityEvent {
  id: string
  type: ActivityEventType
  entityType: 'sprint' | 'task' | 'agent'
  entityId: string
  actorName: string
  payload: Record<string, unknown>
  createdAt: string
}
```

### Event Types

```typescript
type ActivityEventType =
  | 'task_assigned'      // Task assigned to someone
  | 'task_status_changed'// Task status updated
  | 'comment_added'      // Comment on task
  | 'sprint_updated'     // Sprint details modified
  | 'sprint_archived'    // Sprint archived
```

### Payload Examples

```typescript
// task_assigned
{
  type: 'task_assigned',
  payload: { taskId: 'task-123', assignee: 'bob', priority: 'high' }
}

// task_status_changed
{
  type: 'task_status_changed',
  payload: { taskId: 'task-123', from: 'todo', to: 'in_progress' }
}

// comment_added
{
  type: 'comment_added',
  payload: { taskId: 'task-123', comment: 'looks good', commentId: 'cmt-1' }
}

// sprint_updated
{
  type: 'sprint_updated',
  payload: { sprintId: 'sprint-1', field: 'endDate', value: '2026-03-20' }
}

// sprint_archived
{
  type: 'sprint_archived',
  payload: { sprintId: 'sprint-1', archivedAt: '2026-03-19T10:00:00Z' }
}
```

## Performance Considerations

### Polling Interval

Default polling is 30 seconds. For real-time activity dashboards, consider:

```tsx
// Real-time: 5-10s polling
useActivityFeed({ sprintId, pollingInterval: 5000 })

// Background: 60s+ polling
useActivityFeed({ sprintId, pollingInterval: 60000 })
```

### Cursor-Based Pagination

Cursor pagination is more efficient than offset pagination because:
- New events don't shift existing results
- Clients always see consistent data ordering
- No "phantom entries" when data changes between requests

### Cache Sizing

With 2min `gcTime` and 30s polling, expect ~4 cached pages in typical usage. For larger feeds:

```tsx
// Increase poll interval or gc time
useActivityFeed({
  sprintId,
  limit: 100,
  pollingInterval: 60000, // 1 minute
})
```

## Testing

See `useActivityFeed.test.ts` for test patterns:

```typescript
it('should invalidate cache on task assignment', () => {
  const { result } = renderHook(() => useActivityFeed({ sprintId: 'sprint-1' }))
  const queryClient = result.current // Access from hook

  queryClient.invalidateQueries({
    queryKey: queryKeys.activity.feed('task', 'task-123')
  })

  // Assert cache was cleared
})
```

## Migration from useQuery

If migrating from the old `useActivityFeed` hook:

**Before:**
```typescript
const { data: events } = useActivityFeed({ limit: 50 })
```

**After:**
```typescript
const { data } = useActivityFeed({ limit: 50 })
const events = data?.pages.flatMap(p => p.events) ?? []
```

## Related Hooks

- `useSprintMetrics`: For sprint-level KPIs and statistics
- `useUpdateTask`: Mutation hook that invalidates activity feeds
- `useCreateComment`: Mutation hook that appends to activity feeds
