# Notification Center Implementation (FAB-119)

## Overview

Real-time notification center system using TanStack Query polling capabilities. Supports agent task events, sprint changes, and performance alerts with optimistic updates and unread count tracking.

## Architecture

### Core Components

#### `useNotifications` Hook
- **Location**: `src/hooks/useNotifications.ts`
- **Query Key**: `['notifications', { type, unreadOnly, pageIndex, pageSize }]`
- **Polling**: 30 seconds (configurable)
- **Cache Strategy**: Stale-while-revalidate (30s stale, 5min gc)
- **Retry**: Exponential backoff (3 attempts)

### API Endpoints

#### GET /api/notifications
Fetch notifications with optional filtering.

**Query Parameters**:
- `unread=true` - Only fetch unread notifications
- `type=agent_event|sprint_change|performance_alert` - Filter by type
- `pageIndex=0` - Pagination offset
- `pageSize=20` - Results per page

**Response**:
```json
{
  "data": [
    {
      "id": "notif-1",
      "type": "agent_event",
      "message": "Agent Alice completed task: Authentication module",
      "timestamp": "2026-03-07T20:00:00Z",
      "read": false,
      "metadata": { "source": "system", "priority": "normal" }
    }
  ],
  "total": 42,
  "unreadCount": 5
}
```

#### PATCH /api/notifications/:id/read
Mark a single notification as read (supports optimistic updates).

**Request**:
```
PATCH /api/notifications/notif-1/read
```

**Response**:
```json
{
  "id": "notif-1",
  "type": "agent_event",
  "message": "Agent Alice completed task...",
  "timestamp": "2026-03-07T20:00:00Z",
  "read": true,
  "metadata": { "source": "system", "priority": "normal" }
}
```

#### PATCH /api/notifications/read-batch
Mark multiple notifications as read.

**Request**:
```json
{
  "ids": ["notif-1", "notif-2", "notif-3"]
}
```

**Response**: Array of updated notifications

## Usage Examples

### Basic Usage with Auto-Polling

```tsx
import { useNotifications } from '@/hooks'

export function NotificationCenter() {
  const { data, unreadCount, isLoading, markAsRead } = useNotifications()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="notification-center">
      <h2>Unread: {unreadCount}</h2>
      {data.map(notif => (
        <div
          key={notif.id}
          className={notif.read ? 'read' : 'unread'}
          onClick={() => markAsRead.mutate(notif.id)}
        >
          <p>{notif.message}</p>
          <time>{new Date(notif.timestamp).toLocaleTimeString()}</time>
        </div>
      ))}
    </div>
  )
}
```

### Filtering by Type

```tsx
// Only show performance alerts
const { data: alerts } = useNotifications({
  type: 'performance_alert',
  refetchInterval: 60000, // 1 minute
})
```

### Showing Only Unread

```tsx
// Only fetch unread notifications
const { data: unread, unreadCount } = useNotifications({
  unreadOnly: true,
})
```

### Batch Mark as Read

```tsx
const { markAsReadBatch } = useNotifications()

function clearAll(notificationIds: string[]) {
  markAsReadBatch.mutate(notificationIds)
}
```

### Custom Polling Interval

```tsx
const { data, refetch, isRefetching } = useNotifications({
  refetchInterval: 15000, // Poll every 15 seconds
  refetchOnWindowFocus: true, // Refetch when window regains focus
})
```

## Data Types

```typescript
export type NotificationType = 'agent_event' | 'sprint_change' | 'performance_alert'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  read: boolean
  metadata?: Record<string, unknown>
}

export interface NotificationsResponse {
  data: Notification[]
  total: number
  unreadCount: number
}
```

## Features

### ✅ Real-time Polling
- Automatic 30-second polling interval
- Configurable polling frequency
- Refetch on window focus for fresh data

### ✅ Optimistic Updates
- Mark as read mutations with optimistic cache updates
- Instant UI feedback without waiting for server response
- Automatic rollback on mutation failure

### ✅ Type Filtering
- Filter notifications by type: `agent_event`, `sprint_change`, `performance_alert`
- Separate query cache per filter combination

### ✅ Unread Tracking
- Real-time unread count calculation
- Optimistic count updates when marking as read
- Automatic count restoration on error

### ✅ Pagination
- Offset-based pagination with configurable page size
- Separate cache entries for each page
- Total count in response for UI awareness

### ✅ Error Handling
- Exponential backoff retry (3 attempts)
- Max delay capped at 30 seconds
- Graceful error state exposure

### ✅ Cache Management
- Stale-while-revalidate strategy (30s stale time)
- 5-minute garbage collection period
- Proper cache invalidation on mutations

## Query Key Structure

The hook uses structured query keys for proper cache management:

```
['notifications', { type, unreadOnly, pageIndex, pageSize }]
```

This ensures:
- Separate cache entries for different filter combinations
- Proper cache invalidation on mutations
- Ability to target specific queries for refetch/invalidation

## Integration with Other Hooks

This notification system works seamlessly with other TanStack Query patterns:

```tsx
// Combine with other hooks
const { data: tasks } = useTasks()
const { data: notifications, unreadCount } = useNotifications()
const { data: sprints } = useSprints()

// All share the same QueryClient and cache management
```

## Testing

The MSW handler generates realistic notification data including:
- Agent completion events
- Sprint updates and burndown changes
- Performance alerts and metrics

Mock data includes proper timestamps, metadata, and a mix of read/unread notifications.

## Performance Considerations

- **Polling Overhead**: 30-second interval balances freshness with network load
- **Cache Efficiency**: Structured query keys prevent cache duplication
- **Optimistic Updates**: Provide instant feedback without round-trip latency
- **Window Focus**: Smart refetch only when user returns to tab

## Next Steps

This foundation enables:
1. Notification UI components (toast, center, badge count)
2. Notification preferences and filtering
3. Web socket integration for instant delivery (replacing polling)
4. Notification history and archival
5. Push notifications when tab is closed
