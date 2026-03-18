# Notification Action Mutations Implementation Guide

## Overview

The `useNotificationActionMutations` hook provides a type-safe way to perform actionable interactions with notifications beyond simple mark-as-read operations. It complements the `useNotifications` hook and `useNotificationPreferences` hook to create a complete notification system.

## Features

- **Quick-Assign from Notification** — Assign tasks directly from notification context
- **Snooze Notifications** — Defer non-critical alerts with multiple duration options
- **Dismiss Notifications** — Remove notifications without marking as read
- **Batch Operations** — Perform bulk actions on multiple notifications simultaneously
- **Optimistic Updates** — Responsive UI with rollback on errors
- **Cache Invalidation** — Automatically syncs notifications and assignments queries
- **Type-Safe APIs** — Full TypeScript support for all parameters and responses
- **Retry Logic** — Exponential backoff with 3 automatic retries

## API Reference

### Hook Import

```typescript
import { useNotificationActionMutations } from '@/hooks'
import type { UseNotificationActionMutationsReturn } from '@/hooks'
```

### Hook Signature

```typescript
function useNotificationActionMutations(): UseNotificationActionMutationsReturn
```

### Returned Mutations

#### 1. Assign from Notification

Quickly assign a task to an agent directly from a notification.

```typescript
const { assignFromNotification, assignFromNotificationAsync, assignFromNotificationLoading, assignFromNotificationError } = useNotificationActionMutations()

// Synchronous (fire-and-forget)
assignFromNotification(notificationId, agentId)

// Asynchronous (with promise)
try {
  const result = await assignFromNotificationAsync(notificationId, agentId)
  console.log('Task assigned:', result.taskId, 'to agent:', result.agentId)
} catch (error) {
  console.error('Assignment failed:', error.message)
}
```

**Parameters:**
- `notificationId` (string) — ID of the notification to assign from
- `agentId` (string) — ID of the agent to assign to

**Response:**
```typescript
{
  success: boolean
  notificationId: string
  agentId: string
  taskId: string
  message: string
}
```

**Behavior:**
- Marks the notification as read after successful assignment
- Invalidates both notifications and assignments queries
- Optimistic update removes notification from view

#### 2. Snooze Notification

Defer non-critical notifications for later review.

```typescript
const { snoozeNotification, snoozeNotificationAsync, snoozeNotificationLoading, snoozeNotificationError } = useNotificationActionMutations()

// Synchronous
snoozeNotification(notificationId, '30m')

// Asynchronous
const result = await snoozeNotificationAsync(notificationId, '1h')
console.log('Notification will reappear at:', result.resumeAt)
```

**Parameters:**
- `notificationId` (string) — ID of the notification to snooze
- `duration` (SnoozeDuration) — Duration options: `'5m' | '15m' | '30m' | '1h' | '4h' | '1d'`

**Response:**
```typescript
{
  success: boolean
  notificationId: string
  resumeAt: string  // ISO timestamp when notification reappears
  message: string
}
```

**Behavior:**
- Removes notification from current view (optimistic)
- Will reappear after specified duration
- Does not mark as read

#### 3. Dismiss Notification

Remove a notification from view without marking it as read.

```typescript
const { dismissNotification, dismissNotificationAsync, dismissNotificationLoading, dismissNotificationError } = useNotificationActionMutations()

// Synchronous
dismissNotification(notificationId)

// Asynchronous
await dismissNotificationAsync(notificationId)
```

**Parameters:**
- `notificationId` (string) — ID of the notification to dismiss

**Response:**
```typescript
{
  success: boolean
  notificationId: string
  message: string
}
```

**Behavior:**
- Removes notification from all views
- Does not mark as read
- Unlike snooze, dismissed notifications don't reappear

#### 4. Batch Notification Actions

Perform bulk operations on multiple notifications in a single request.

```typescript
const { batchNotificationActions, batchNotificationActionsAsync, batchNotificationActionsLoading, batchNotificationActionsError } = useNotificationActionMutations()

// Mark multiple as read
batchNotificationActions(['notif-1', 'notif-2', 'notif-3'], 'mark-read')

// Assign multiple (requires payload with agentId)
await batchNotificationActionsAsync(
  ['notif-1', 'notif-2'],
  'assign',
  { agentId: 'agent-5' }
)

// Dismiss multiple
batchNotificationActions(['notif-1', 'notif-2'], 'dismiss')

// Snooze multiple
batchNotificationActions(['notif-1', 'notif-2'], 'snooze', { duration: '1h' })
```

**Parameters:**
- `ids` (string[]) — Array of notification IDs
- `action` (NotificationActionType) — Action type: `'assign' | 'snooze' | 'dismiss' | 'mark-read'`
- `payload` (optional) — Action-specific parameters:
  - For `assign`: `{ agentId: string }`
  - For `snooze`: `{ duration: SnoozeDuration }`

**Response:**
```typescript
{
  success: boolean        // true if all operations succeeded
  updated: number        // count of successful operations
  failed: number         // count of failed operations
  results: Array<{
    id: string
    success: boolean
    error?: string        // error message if failed
  }>
}
```

**Behavior:**
- Atomic operation at API level (single HTTP request)
- Optimistic updates for all affected notifications
- Partial failures are allowed (returns success:false if any fail)
- Invalidates both notifications and assignments queries on success

## Usage Examples

### Example 1: Quick Task Assignment Flow

```typescript
import { useNotifications, useNotificationActionMutations } from '@/hooks'

function NotificationCenter() {
  const { notifications } = useNotifications()
  const { assignFromNotification, assignFromNotificationLoading } = useNotificationActionMutations()

  const handleAssignTask = (notifId: string, agentId: string) => {
    assignFromNotification(notifId, agentId)
  }

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <div key={notif.id} className="flex items-center justify-between p-3 bg-white rounded border">
          <p>{notif.message}</p>
          {notif.type === 'assignment_changed' && (
            <button
              onClick={() => handleAssignTask(notif.id, 'agent-1')}
              disabled={assignFromNotificationLoading}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Assign
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Example 2: Snooze with Duration Selection

```typescript
function NotificationCard({ notification }) {
  const { snoozeNotification } = useNotificationActionMutations()

  return (
    <div className="p-4 bg-gray-50 rounded">
      <p>{notification.message}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => snoozeNotification(notification.id, '15m')}>
          Snooze 15m
        </button>
        <button onClick={() => snoozeNotification(notification.id, '1h')}>
          Snooze 1h
        </button>
        <button onClick={() => snoozeNotification(notification.id, '1d')}>
          Snooze 1d
        </button>
      </div>
    </div>
  )
}
```

### Example 3: Batch Dismiss in Notification Panel

```typescript
function NotificationPanel() {
  const { notifications } = useNotifications()
  const { batchNotificationActions, batchNotificationActionsLoading } = useNotificationActionMutations()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleDismissSelected = () => {
    batchNotificationActions(selectedIds, 'dismiss')
    setSelectedIds([])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3>Notifications ({notifications.length})</h3>
        {selectedIds.length > 0 && (
          <button
            onClick={handleDismissSelected}
            disabled={batchNotificationActionsLoading}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Dismiss Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => (
          <label key={notif.id} className="flex items-center p-3 bg-white rounded border cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.includes(notif.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds([...selectedIds, notif.id])
                } else {
                  setSelectedIds(selectedIds.filter((id) => id !== notif.id))
                }
              }}
              className="mr-3"
            />
            <span className="flex-1">{notif.message}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

### Example 4: Batch Mark Multiple as Read

```typescript
function NotificationTopBar() {
  const { notifications, unreadCount } = useNotifications()
  const { batchNotificationActions, batchNotificationActionsLoading } = useNotificationActionMutations()

  const unreadNotifications = notifications.filter((n) => !n.read)

  const handleMarkAllAsRead = () => {
    if (unreadNotifications.length === 0) return

    batchNotificationActions(
      unreadNotifications.map((n) => n.id),
      'mark-read'
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
      <div>
        <strong>Notifications</strong>
        <span className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">
          {unreadCount}
        </span>
      </div>
      {unreadCount > 0 && (
        <button
          onClick={handleMarkAllAsRead}
          disabled={batchNotificationActionsLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Mark all as read
        </button>
      )}
    </div>
  )
}
```

## Query Key Strategy

The hook uses the following query keys for cache management:

```typescript
// Notification queries (from useNotifications hook)
['notifications']  // All notifications
['notifications', { unreadOnly: false }]  // All notifications (paginated)
['notifications', { unreadOnly: true }]   // Unread only (paginated)

// Assignment queries (managed by useNotificationActionMutations)
['assignments']  // All assignments
['assignments', 'list']  // Assignment list
['assignments', { agentId: 'agent-1' }]  // Agent-specific assignments
```

On success, the hook invalidates:
- `['notifications']` (all notification queries)
- `['assignments']` (all assignment queries)

This ensures that:
1. Notifications list shows updated state
2. Agent assignment load is recalculated
3. Unread count is refreshed
4. Pagination cursors are properly reset

## Error Handling

All mutations include built-in retry logic with exponential backoff:

```typescript
// Example error handling
const { assignFromNotification, assignFromNotificationError } = useNotificationActionMutations()

assignFromNotification(notifId, agentId)

useEffect(() => {
  if (assignFromNotificationError) {
    console.error('Assignment failed:', assignFromNotificationError.message)
    // Show error toast to user
    showErrorToast('Failed to assign task')
  }
}, [assignFromNotificationError])
```

## Optimistic Updates

All mutations perform optimistic updates for instant UI feedback:

1. **assignFromNotification** — Marks notification as read
2. **snoozeNotification** — Removes notification from view
3. **dismissNotification** — Removes notification from view
4. **batchNotificationActions** — Updates/removes notifications based on action

If the mutation fails, the UI automatically reverts to the previous state.

## Performance Considerations

- **Batch operations** reduce network requests (single POST instead of N requests)
- **Optimistic updates** eliminate perceived latency
- **Cache invalidation** is minimal (only affected queries are refetched)
- **Query key separation** prevents unnecessary refetches of unrelated data
- **Exponential backoff** reduces server load on transient errors

## Testing

Example test patterns for components using this hook:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/mocks'
import { rest } from 'msw'

const queryClient = new QueryClient()

test('should assign task from notification', async () => {
  const user = userEvent.setup()

  render(
    <QueryClientProvider client={queryClient}>
      <NotificationCard notification={mockNotification} />
    </QueryClientProvider>
  )

  const assignButton = screen.getByRole('button', { name: /assign/i })
  await user.click(assignButton)

  await waitFor(() => {
    expect(screen.getByText(/assigned/i)).toBeInTheDocument()
  })
})
```

## Migration from Previous Patterns

If you were previously using manual fetch calls for notification actions:

**Before:**
```typescript
const handleAssign = async (notifId, agentId) => {
  try {
    const res = await fetch('/api/notifications/assign', {
      method: 'POST',
      body: JSON.stringify({ notificationId: notifId, agentId }),
    })
    const data = await res.json()
    // Manual cache invalidation
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  } catch (error) {
    // Manual error handling
  }
}
```

**After:**
```typescript
const { assignFromNotification } = useNotificationActionMutations()

const handleAssign = (notifId, agentId) => {
  assignFromNotification(notifId, agentId)
  // Automatic cache invalidation and error handling
}
```

## Related Hooks

- **`useNotifications`** — Fetch and manage notifications with infinite scroll
- **`useNotificationPreferences`** — Configure notification settings and frequency
- **`useNotificationCenter`** — Alternative legacy hook for notification state management
- **`useTaskAssignment`** — Manage task assignments (works alongside this hook)
