# Real-Time Notifications System — Implementation Guide

## Overview

The Real-Time Notifications System provides a centralized way to manage real-time notifications in the application, preventing scattered toast messages and maintaining clean state management. It demonstrates subscription patterns with TanStack Query for real-time data fetching.

## Architecture

### Notification Types

The system supports 8 distinct notification types:

- **Task Notifications**
  - `task_assigned`: User assigned to a task
  - `task_unassigned`: User unassigned from a task

- **Sprint Notifications**
  - `sprint_started`: Sprint lifecycle event
  - `sprint_completed`: Sprint completion event

- **Activity Notifications**
  - `comment_added`: Comment added to a task/sprint
  - `status_changed`: Entity status changed

- **System Notifications**
  - `agent_event`: General agent activity
  - `performance_alert`: Performance-related alerts

### Core Components

#### 1. Notification Types (`src/types/notification.ts`)

```typescript
export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  read: boolean
  metadata?: NotificationMetadata
}

export interface NotificationMetadata {
  entityId?: string
  entityType?: 'task' | 'sprint' | 'agent' | 'comment'
  priority?: 'low' | 'normal' | 'high'
  source?: string
  actor?: string
  [key: string]: unknown
}
```

#### 2. useNotifications Hook (`src/hooks/useNotifications.ts`)

The main hook for managing notifications with polling and real-time updates.

**Features:**
- Auto-polling with configurable interval (default: 30s)
- Window focus refetch for fresh data
- WebSocket integration for real-time updates (optional)
- Optimistic updates for mark as read/dismiss
- Exponential backoff retry logic
- Batch mark as read operations

**Usage:**

```typescript
const {
  data: notifications,
  isPending,
  error,
  unreadCount,
  markAsRead,
  markAsReadBatch,
  dismiss,
  wsConnected,
  refetch,
} = useNotifications({
  refetchInterval: 30 * 1000,      // Poll every 30s
  refetchOnWindowFocus: true,       // Refetch on window focus
  enableWebSocket: true,            // Enable WebSocket
  unreadOnly: false,                // Show all notifications
  pageSize: 20,                     // Pagination
})
```

**Query Key Structure:**
```typescript
['notifications', { type, unreadOnly, pageIndex, pageSize }]
```

### Subscription Pattern

The notification system demonstrates a **subscription pattern** using TanStack Query:

```typescript
// 1. Query Setup — Data fetching with polling
const query = useQuery({
  queryKey: ['notifications', ...filters],
  queryFn: fetchNotifications,
  refetchInterval: 30 * 1000,           // Polling
  refetchOnWindowFocus: true,           // Window focus handler
  staleTime: 30 * 1000,                 // Stale data tolerance
  gcTime: 5 * 60 * 1000,                // Cache duration
})

// 2. Mutation Setup — State changes
const markAsReadMutation = useMutation({
  mutationFn: markAsRead,
  onMutate: optimisticUpdate,           // Immediate UI update
  onError: rollbackOnError,             // Revert on failure
})

// 3. WebSocket Integration — Real-time updates
useWebSocket({
  onMessage: (msg) => {
    if (msg.type === 'notification:new') {
      queryClient.invalidateQueries({ queryKey })  // Refetch
    }
  }
})
```

**Why This Pattern?**

1. **Single Source of Truth**: Notifications are cached by TanStack Query
2. **Optimistic Updates**: UI responds immediately without waiting for server
3. **Automatic Invalidation**: Changes trigger appropriate cache updates
4. **Polling Fallback**: Works even if WebSocket is unavailable
5. **Built-in Retry Logic**: Automatic exponential backoff on errors

### Components

#### NotificationCenter

Dropdown panel showing notifications in the top navigation.

**Features:**
- Badge showing unread count
- Mark as read button for individual notifications
- Mark all as read bulk action
- Dismiss individual notifications
- Click-outside to close
- Keyboard navigation (Escape)
- Loading and error states
- Empty state handling

**Integration in App Shell** (`src/routes/__root.tsx`):

```typescript
<nav>
  <NotificationCenter />  {/* Top-right corner */}
</nav>
```

#### AppNotificationCenter

Persistent sidebar panel for system notifications.

**Features:**
- Always-visible notification list
- Type-based color coding
- Clear all button
- Automatic dismiss support

**Integration in App Shell**:

```typescript
<AppNotificationCenter />  {/* Right sidebar */}
```

### MSW Handler

The mock handler simulates the `/api/notifications` endpoint with realistic data:

```typescript
// GET /api/notifications
// Query parameters:
// - type: Filter by notification type
// - unread: Show only unread (true/false)
// - pageIndex: Pagination offset
// - pageSize: Items per page

// Response:
{
  data: Notification[],
  total: number,
  unreadCount: number
}

// PATCH /api/notifications/:id/read
// Mark single notification as read

// PATCH /api/notifications/read-batch
// Mark multiple notifications as read

// PATCH /api/notifications/:id/dismiss
// Dismiss/remove a notification
```

## Usage Examples

### Basic Usage

```typescript
import { useNotifications } from '@/hooks/useNotifications'

export function MyComponent() {
  const {
    data: notifications,
    unreadCount,
    markAsRead,
    dismiss,
  } = useNotifications()

  return (
    <div>
      <h2>Unread: {unreadCount}</h2>
      {notifications.map((notif) => (
        <div key={notif.id}>
          <p>{notif.message}</p>
          <button onClick={() => markAsRead.mutate(notif.id)}>
            Mark as read
          </button>
          <button onClick={() => dismiss.mutate(notif.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Advanced: Filtering by Type

```typescript
// Only show task-related notifications
const { data: taskNotifications } = useNotifications({
  type: 'task_assigned',
})

// Only show unread notifications
const { data: unreadNotifications } = useNotifications({
  unreadOnly: true,
})

// Combine filters
const { data: unreadTaskNotifications } = useNotifications({
  type: 'task_assigned',
  unreadOnly: true,
})
```

### Batch Operations

```typescript
const { markAsReadBatch } = useNotifications()

// Mark multiple as read
const unreadIds = notifications
  .filter(n => !n.read)
  .map(n => n.id)

markAsReadBatch.mutate(unreadIds)
```

### Real-time Monitoring

```typescript
const {
  data: notifications,
  wsConnected,
  isRefetching,
} = useNotifications({
  enableWebSocket: true,
})

return (
  <div>
    {wsConnected && <span>🔴 Live</span>}
    {isRefetching && <span>Syncing...</span>}
  </div>
)
```

## Design Patterns

### 1. Optimistic Updates

When marking as read or dismissing, the UI updates immediately:

```typescript
onMutate: async (notificationId) => {
  // Cancel ongoing queries
  await queryClient.cancelQueries({ queryKey })

  // Get current data
  const previousData = queryClient.getQueryData(queryKey)

  // Optimistically update UI
  queryClient.setQueryData(queryKey, optimisticData)

  return previousData  // For rollback
},
onError: (error, variables, context) => {
  // Revert on error
  queryClient.setQueryData(queryKey, context)
}
```

**Benefits:**
- Instant feedback
- Better perceived performance
- Graceful error handling

### 2. Query Invalidation

Different update scenarios:

```typescript
// New notification received
queryClient.invalidateQueries({
  queryKey: ['notifications']  // Full refetch
})

// Single notification updated
queryClient.setQueryData(queryKey, (old) => ({
  ...old,
  data: old.data.map(n =>
    n.id === updated.id ? updated : n
  )
}))

// Notification dismissed
queryClient.setQueryData(queryKey, (old) => ({
  ...old,
  data: old.data.filter(n => n.id !== dismissed.id)
}))
```

### 3. Polling with Window Focus

```typescript
useQuery({
  // ... other config
  refetchInterval: 30 * 1000,      // Poll every 30s
  refetchOnWindowFocus: true,      // Refetch on focus
  refetchOnReconnect: true,        // Refetch on network restore
})
```

**Behavior:**
- If window is in focus, refetch every 30s
- When user switches to another tab, pause polling
- Resume polling when they return

### 4. Cache Strategy: Stale-While-Revalidate

```typescript
staleTime: 30 * 1000,              // Data is fresh for 30s
gcTime: 5 * 60 * 1000,             // Keep cached for 5 min
refetchInterval: 30 * 1000,        // Refetch every 30s
```

**Result:**
- User sees cached data immediately (fast)
- Query refetches in background (fresh)
- If refetch fails, user still sees cached data (resilient)

## Session-Based Dismissal

Dismissals are session-based (non-persistent):

```typescript
// Dismiss mutation
{
  mutationFn: async (notificationId) => {
    const response = await fetch(
      `/api/notifications/${notificationId}/dismiss`,
      { method: 'PATCH' }
    )
    return response.json()
  },
  // Optimistically remove from UI
  onMutate: async (notificationId) => {
    const previousData = queryClient.getQueryData(queryKey)
    // ... remove from data
    return previousData
  }
}
```

**Notes:**
- Dismissals are removed from the current list
- On refresh/reload, dismissed notifications reappear
- For persistent dismissal, modify the backend handler

## Testing

### MSW Handler Testing

```typescript
import { setupServer } from 'msw/node'
import { notificationHandlers } from '@/mocks/handlers/notifications'

const server = setupServer(...notificationHandlers)

test('fetches notifications', async () => {
  render(<NotificationCenter />)

  await waitFor(() => {
    expect(screen.getByText(/Agent Alice/)).toBeInTheDocument()
  })
})

test('marks notification as read', async () => {
  render(<NotificationCenter />)

  const markButton = screen.getByLabelText('Mark as read')
  fireEvent.click(markButton)

  await waitFor(() => {
    expect(screen.queryByText('unread')).not.toBeInTheDocument()
  })
})
```

### Hook Testing

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotifications } from '@/hooks/useNotifications'

test('useNotifications returns notifications', async () => {
  const { result } = renderHook(() => useNotifications())

  await waitFor(() => {
    expect(result.current.data.length).toBeGreaterThan(0)
  })
})

test('markAsRead optimistically updates', async () => {
  const { result } = renderHook(() => useNotifications())

  await waitFor(() => {
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  const firstNotif = result.current.data[0]

  act(() => {
    result.current.markAsRead.mutate(firstNotif.id)
  })

  // Optimistic update: immediately reads as true
  expect(
    result.current.data.find(n => n.id === firstNotif.id)?.read
  ).toBe(true)
})
```

## Performance Considerations

1. **Polling Frequency**: Balance freshness vs server load (30s default)
2. **Page Size**: Limit items per page (20 default)
3. **Cache Duration**: Keep in memory based on usage (5 min default)
4. **Batch Operations**: Mark multiple as read in one request
5. **WebSocket**: Optional for higher-frequency updates

## Future Enhancements

1. **Real WebSocket**: Replace polling with true WebSocket
2. **Persistent Dismissals**: Store in backend
3. **Notification Channels**: Subscribe to specific types
4. **Sound/Vibration**: Alert on high-priority
5. **Email Digest**: Periodic summary emails
6. **Notification Preferences**: User-configurable settings

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Polling Patterns](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults#polling)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses)
- [MSW Documentation](https://mswjs.io/)
