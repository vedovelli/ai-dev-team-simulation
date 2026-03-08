# Notification System Backend Integration & WebSocket Setup

This guide documents the complete implementation of the notification system with WebSocket real-time support and TanStack Query integration.

## Architecture Overview

The notification system combines three core components:

1. **`useNotifications` Hook**: Manages fetch state, mutations, and WebSocket lifecycle
2. **MSW Handlers**: Mocks REST endpoints and simulates WebSocket events
3. **Notification Aggregation**: Utilities for global unread counts and statistics

```
┌─────────────────┐
│ React Component │
└────────┬────────┘
         │
    ┌────▼────────────────────────┐
    │  useNotifications Hook       │
    │ ├─ Query (polling fallback)  │
    │ ├─ WebSocket (real-time)     │
    │ ├─ Mutations (PATCH)         │
    │ └─ Aggregation              │
    └────┬────────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │  TanStack Query + WebSocket           │
    │ ├─ Cache management                   │
    │ ├─ Optimistic updates                 │
    │ ├─ Real-time sync                     │
    │ └─ Reconnection logic                 │
    └────┬──────────────────────────────────┘
         │
    ┌────▼───────────────────┐
    │  MSW Mock Handlers      │
    │ ├─ GET /api/notifications    │
    │ ├─ PATCH read/dismiss   │
    │ └─ WebSocket events     │
    └────────────────────────┘
```

## Hook Usage

### Basic Usage

```tsx
import { useNotifications } from '@/hooks/useNotifications'

function NotificationCenter() {
  const {
    data,
    isPending,
    error,
    unreadCount,
    wsConnected,
    markAsRead,
    dismiss,
  } = useNotifications()

  if (isPending) return <div>Loading notifications...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Unread: {unreadCount} {wsConnected && '✓ Live'}</h2>
      {data.map((notification) => (
        <div key={notification.id} className="notification">
          <p>{notification.message}</p>
          <div className="actions">
            <button onClick={() => markAsRead.mutate(notification.id)}>
              {notification.read ? 'Read' : 'Mark as read'}
            </button>
            <button onClick={() => dismiss.mutate(notification.id)}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Advanced Configuration

```tsx
const {
  data,
  unreadCount,
  markAsRead,
} = useNotifications({
  // Enable/disable WebSocket (default: true)
  enableWebSocket: true,

  // Custom WebSocket URL
  wsUrl: 'wss://api.example.com/notifications',

  // Polling interval in milliseconds (default: 30000 = 30s)
  refetchInterval: 60 * 1000,

  // Refetch when window regains focus (default: true)
  refetchOnWindowFocus: true,

  // Filter by notification type
  type: 'performance_alert',

  // Only show unread notifications
  unreadOnly: true,

  // Pagination
  pageIndex: 0,
  pageSize: 20,
})
```

## Notification Type

```typescript
export type NotificationType = 'agent_event' | 'sprint_change' | 'performance_alert'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  read: boolean
  metadata?: {
    source?: string
    priority?: 'low' | 'normal' | 'high'
    [key: string]: unknown
  }
}

export interface NotificationsResponse {
  data: Notification[]
  total: number
  unreadCount: number
}
```

## Query Key Structure

The hook uses a hierarchical query key structure for efficient cache management:

```typescript
['notifications', { type?, unreadOnly?, pageIndex, pageSize }]
```

This allows for:
- Global invalidation: `invalidateQueries({ queryKey: ['notifications'] })`
- Type-specific invalidation: `invalidateQueries({ queryKey: ['notifications', { type: 'agent_event' }] })`
- Precise cache updates with `setQueryData`

## WebSocket Integration

### Message Types

The system handles three WebSocket message types:

#### 1. New Notification
```typescript
{
  type: 'notification:new',
  payload: {
    id: 'notif-123',
    type: 'agent_event',
    message: 'New task assigned',
    timestamp: '2026-03-08T10:00:00Z',
    read: false,
    metadata: { priority: 'normal' }
  }
}
```
**Behavior**: Invalidates query to refetch fresh data

#### 2. Updated Notification
```typescript
{
  type: 'notification:updated',
  payload: {
    id: 'notif-123',
    read: true
  }
}
```
**Behavior**: Optimistically updates cache without fetching

#### 3. Dismissed Notification
```typescript
{
  type: 'notification:dismissed',
  payload: { id: 'notif-123' }
}
```
**Behavior**: Removes from cache

### Reconnection Logic

The WebSocket hook implements exponential backoff:

```
Initial delay: 1000ms
Attempt 1: 1000ms
Attempt 2: 2000ms
Attempt 3: 4000ms
Attempt 4: 8000ms
Attempt 5: 16000ms
Max delay: 30000ms (30s)
```

If connection fails after 5 attempts, polling fallback activates (30s interval).

## API Endpoints

### GET /api/notifications

Fetch notifications with optional filtering and pagination.

**Query Parameters:**
- `type` (optional): Filter by notification type
- `unread` (optional): "true" to show only unread
- `pageIndex` (default: 0): Page number
- `pageSize` (default: 20): Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "notif-1",
      "type": "agent_event",
      "message": "Task completed",
      "timestamp": "2026-03-08T10:00:00Z",
      "read": false,
      "metadata": { "priority": "high" }
    }
  ],
  "total": 42,
  "unreadCount": 5
}
```

### PATCH /api/notifications/{id}/read

Mark a single notification as read.

**Response:**
```json
{
  "id": "notif-1",
  "read": true,
  ...
}
```

### PATCH /api/notifications/read-batch

Mark multiple notifications as read in one request.

**Request Body:**
```json
{
  "ids": ["notif-1", "notif-2", "notif-3"]
}
```

**Response:**
```json
[
  { "id": "notif-1", "read": true, ... },
  { "id": "notif-2", "read": true, ... },
  { "id": "notif-3", "read": true, ... }
]
```

### PATCH /api/notifications/{id}/dismiss

Dismiss (remove) a notification.

**Response:**
```json
{ "success": true }
```

## Optimistic Updates

All mutations implement optimistic updates:

```typescript
// Mark as read optimistically updates cache immediately
markAsRead.mutate(notificationId)

// UI updates instantly
// If error: automatically reverted
// If success: server confirms the change
```

Cache is automatically reverted if mutation fails.

## Cache Invalidation Strategy

The system uses smart invalidation to balance freshness and performance:

1. **Polling**: 30s interval (configurable)
2. **Window focus**: Refetch when user returns to tab
3. **Network reconnect**: Refetch when connection restored
4. **WebSocket events**: Invalidate on new notifications, update on changes
5. **Mutations**: Optimistic updates with automatic rollback on error

## Notification Aggregation

Use the aggregation utilities for global UI state:

```typescript
import {
  getGlobalUnreadCount,
  getNotificationStats,
  hasHighPriorityAlerts,
  getAllUnreadNotifications,
} from '@/utils/notificationAggregation'

function AppHeader() {
  const queryClient = useQueryClient()

  // Get total unread across all filters
  const unreadCount = getGlobalUnreadCount(queryClient)

  // Get stats by type
  const stats = getNotificationStats(queryClient)

  // Check for critical alerts
  const hasCritical = hasHighPriorityAlerts(queryClient)

  // Get all unread notifications
  const unread = getAllUnreadNotifications(queryClient)

  return (
    <header>
      <Badge>
        {unreadCount} unread
        {hasCritical && ' ⚠️ Critical'}
      </Badge>
      <Details>
        Agent events: {stats.byType.agent_event.unread}/{stats.byType.agent_event.total}
        Sprint changes: {stats.byType.sprint_change.unread}/{stats.byType.sprint_change.total}
        Alerts: {stats.byType.performance_alert.unread}/{stats.byType.performance_alert.total}
      </Details>
    </header>
  )
}
```

## Error Boundary

Wrap notification components with error boundary for graceful failure handling:

```tsx
import { NotificationErrorBoundary } from '@/components/NotificationErrorBoundary'

function App() {
  return (
    <NotificationErrorBoundary>
      <NotificationCenter />
    </NotificationErrorBoundary>
  )
}
```

The error boundary:
- Catches WebSocket errors
- Monitors network status
- Gracefully degrades to polling
- Provides retry button to reset state

## Performance Considerations

### Memory Management
- Cache garbage collection: 5 minutes (gcTime)
- Stale time: 30 seconds
- Max cached notification queries: 1 per filter combination

### Network Optimization
- WebSocket for real-time updates (minimal bandwidth)
- Polling fallback every 30s when WebSocket unavailable
- Batch operations for marking multiple read
- Optimistic updates reduce perceived latency

### Re-render Optimization
- Query key structure ensures fine-grained updates
- Mutations only refetch affected query
- WebSocket updates directly update cache (no re-fetch)

## MSW Handler Implementation

The handlers simulate real-world behavior:

```typescript
// In-memory store persists across requests
const notificationsStore: Notification[] = generateMockNotifications()

// Handlers simulate WebSocket broadcasts
http.patch('/api/notifications/:id/dismiss', ({ params }) => {
  const { id } = params
  // Remove from store
  notificationsStore.splice(notifIndex, 1)
  // Broadcast to WebSocket clients
  broadcastToClients({
    type: 'notification:dismissed',
    payload: { id },
  })
  return HttpResponse.json({ success: true })
})
```

## Testing

### Unit Tests
See `src/hooks/__tests__/useNotifications.test.ts`

```typescript
describe('useNotifications', () => {
  it('fetches initial notifications', async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it('marks notification as read optimistically', async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const notif = result.current.data[0]
    act(() => result.current.markAsRead.mutate(notif.id))

    // Optimistic update visible immediately
    expect(result.current.data.find(n => n.id === notif.id)?.read).toBe(true)
  })

  it('reverts on mark-as-read error', async () => {
    // Mock fetch error
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useNotifications())
    const notif = result.current.data[0]

    await act(() => result.current.markAsRead.mutateAsync(notif.id))

    // Error state captured
    expect(result.current.markAsRead.error).toBeDefined()
    // Cache reverted to previous state
    expect(result.current.data.find(n => n.id === notif.id)?.read).toBe(false)
  })
})
```

## Troubleshooting

### WebSocket Not Connecting
1. Check browser WebSocket support
2. Verify WSS protocol in production
3. Check CORS headers for WebSocket handshake
4. Monitor console for connection errors

### Notifications Not Updating in Real-time
1. Enable WebSocket with `enableWebSocket: true`
2. Check WebSocket connection status via `wsConnected`
3. Verify message types match handler expectations
4. Fall back to polling if WebSocket unavailable

### High Unread Count
1. Check for duplicate notifications with same ID
2. Verify `read` flag updates correctly
3. Use aggregation utilities to debug count discrepancies
4. Check for multiple hook instances with same query key

## Migration Guide

If upgrading from polling-only to WebSocket:

```typescript
// Before (polling only)
useNotifications({
  refetchInterval: 30 * 1000,
})

// After (WebSocket + polling fallback)
useNotifications({
  enableWebSocket: true,      // NEW
  refetchInterval: 30 * 1000, // Fallback for WS unavailability
})
```

No breaking changes - WebSocket is opt-in and gracefully degrades to polling.
