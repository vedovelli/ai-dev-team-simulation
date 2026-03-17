# NotificationCenter Orchestration Hook Implementation Guide

## Overview

The `useNotificationCenter` hook provides a complete notification management solution by coordinating the `useNotifications` and `useNotificationPreferences` hooks. It implements client-side filtering of notifications based on user preference settings, ensuring users only see notifications they've enabled.

## Architecture

```
┌─────────────────────────────────────────────┐
│   useNotificationCenter (Orchestration)     │
├─────────────────────────────────────────────┤
│ • Client-side filtering by preference       │
│ • Recompute on preference changes           │
│ • Coordinate cache invalidation             │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
useNotifications  useNotificationPreferences
Query: ['notifications']  Query: ['notificationPreferences']
- Infinite scroll         - Caching with 5min stale time
- Polling (30s)          - Update mutations
```

## Hook API

```typescript
const {
  // Filtered data
  notifications,      // Notification[] - filtered by enabled types + subscribed types
  unreadCount,        // number - unread count for enabled types only

  // User preferences
  preferences,        // NotificationPreferences | undefined

  // Loading states
  isLoading,          // boolean
  isError,            // boolean
  error,              // Error | null
  preferencesLoading, // boolean
  preferencesError,   // Error | null

  // Mutation states
  markAsReadLoading,      // boolean
  dismissLoading,         // boolean
  dismissMultipleLoading, // boolean
  clearAllLoading,        // boolean
  isUpdatingPreferences,  // boolean

  // Error states
  markAsReadError,        // Error | null
  dismissError,           // Error | null
  dismissMultipleError,   // Error | null
  clearAllError,          // Error | null
  updatePreferencesError, // Error | null

  // Actions - Individual operations
  markAsRead,              // (id: string) => void
  dismissNotification,     // (id: string) => void

  // Actions - Batch operations
  markMultipleAsRead,      // (ids: string[]) => Promise<Notification[]>
  markAllAsRead,           // () => Promise<{ success: boolean; markedCount: number }>
  dismissMultiple,         // (ids: string[]) => void
  dismissAllReadNotifications, // () => void
  clearAll,                // () => void

  // Actions - Preferences
  updatePreferences,       // (patch: UpdatePreferencesRequest) => void
  resetPreferences,        // () => Promise<NotificationPreferences>

  // Infinite scroll
  fetchNextPage,      // () => Promise<void>
  hasNextPage,        // boolean
  isFetchingNextPage, // boolean

  // Advanced (unfiltered data)
  allNotifications,   // Notification[] - all notifications
  allUnreadCount,     // number - unread count for all types
  total,              // number - filtered notification count
} = useNotificationCenter()
```

## Usage Examples

### Basic Usage

```tsx
import { useNotificationCenter } from '@/hooks'

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead } = useNotificationCenter()

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  )
}
```

### Controlling Polling Interval

```tsx
const { notifications } = useNotificationCenter({
  notificationsOptions: {
    refetchInterval: 60 * 1000, // 60 seconds instead of default 30s
  },
})
```

### Subscribe to Specific Notification Types

Filter notifications by specific event types. Notifications must both:
1. Be enabled in user preferences, AND
2. Match one of the `subscribedTypes`

```tsx
// Only show assignment and deadline notifications
const { notifications, unreadCount } = useNotificationCenter({
  subscribedTypes: ['assignment_changed', 'deadline_approaching'],
})

// Show all notifications of enabled types (default, empty array = no type filter)
const { notifications: allEnabled } = useNotificationCenter({
  subscribedTypes: [],
})

// Show only task reassignment events
const { notifications: reassignOnly } = useNotificationCenter({
  subscribedTypes: ['task_reassigned'],
})
```

**Available Event Types:**
- `'assignment_changed'` - Task assignment notifications
- `'sprint_updated'` - Sprint status updates
- `'task_reassigned'` - Task reassignment events
- `'deadline_approaching'` - Upcoming deadlines

**Note:** Type subscription adds an additional filter on top of preference-based filtering. If a user disables a type in preferences, it won't show even if it's in `subscribedTypes`.

### Handling Preference Changes

When a user updates their notification preferences, the `unreadCount` and `notifications` list automatically recompute without making a server request:

```tsx
export function NotificationSettings() {
  const { preferences, updatePreferences } = useNotificationCenter()

  const toggleNotificationType = (type: string) => {
    if (preferences?.[type as any]) {
      updatePreferences({
        [type]: {
          ...preferences[type as any],
          enabled: !preferences[type as any].enabled,
        },
      })
    }
  }

  return (
    <div>
      {Object.entries(preferences || {}).map(([type, pref]) => {
        if (typeof pref === 'object' && 'enabled' in pref) {
          return (
            <label key={type}>
              <input
                type="checkbox"
                checked={pref.enabled}
                onChange={() => toggleNotificationType(type)}
              />
              {type}
            </label>
          )
        }
      })}
    </div>
  )
}
```

### Batch Operations with Preferences Filter

#### Mark All As Read

```tsx
export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsReadLoading,
  } = useNotificationCenter()

  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0) {
      const result = await markAllAsRead()
      console.log(`Marked ${result.markedCount} as read`)
    }
  }

  return (
    <div>
      <button
        onClick={handleMarkAllAsRead}
        disabled={markAsReadLoading || unreadCount === 0}
      >
        Mark all as read ({unreadCount})
      </button>
    </div>
  )
}
```

#### Dismiss Multiple Notifications

```tsx
export function NotificationActions() {
  const {
    notifications,
    dismissMultiple,
    dismissMultipleLoading,
  } = useNotificationCenter()

  const handleDismissMultiple = () => {
    // Get IDs of first 5 notifications
    const idsToRemove = notifications.slice(0, 5).map((n) => n.id)
    if (idsToRemove.length > 0) {
      dismissMultiple(idsToRemove)
    }
  }

  return (
    <button
      onClick={handleDismissMultiple}
      disabled={dismissMultipleLoading}
    >
      Clear first 5
    </button>
  )
}
```

#### Clear All Notifications

```tsx
export function NotificationPanel() {
  const {
    notifications,
    clearAll,
    clearAllLoading,
  } = useNotificationCenter()

  return (
    <div>
      <h2>Notifications ({notifications.length})</h2>
      {notifications.length > 0 && (
        <button
          onClick={clearAll}
          disabled={clearAllLoading}
        >
          Clear all
        </button>
      )}
      {/* notification list */}
    </div>
  )
}
```

### Infinite Scroll with Preferences

```tsx
export function NotificationList() {
  const {
    notifications,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationCenter()

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
      {isFetchingNextPage && <LoadingSpinner />}
    </div>
  )
}
```

## Client-Side Filtering Strategy

The hook implements instant filtering based on user preferences:

1. **Fetches all notifications** from the API (using `useNotifications`)
2. **Fetches user preferences** (using `useNotificationPreferences`)
3. **Filters in-memory** using `filterNotificationsByPreferences()`
4. **Computes unread count** only for enabled notification types

**Benefits:**
- No server round-trip for filtering (instant filtering on preference changes)
- Uses `queryData` to access cache without making API calls
- Reduces API requests and latency
- Responsive UI updates when preferences change

## Preference Type Matching

Notifications are filtered using two strategies:

1. **Structured Events** (modern):
   - Uses `notification.eventType` field
   - Values: `'assignment_changed'`, `'sprint_updated'`, `'task_reassigned'`, `'deadline_approaching'`

2. **Legacy Types** (fallback):
   - Uses `notification.type` field
   - Values: `'task_assigned'`, `'sprint_started'`, `'comment_added'`, etc.

**Example notification with structured event:**

```json
{
  "id": "123",
  "eventType": "assignment_changed",
  "type": "task_assigned",
  "message": "You were assigned to Task #5",
  "timestamp": "2026-03-16T10:30:00Z",
  "read": false
}
```

The hook checks preferences for `assignment_changed` first, then falls back to `task_assigned` if needed.

## Query Key Structure

- **Notifications**: `['notifications']`, `['notifications', { unreadOnly }]`
- **Preferences**: `['notificationPreferences']`
- **Derived State**: Computed client-side, no additional query keys

## Cache Invalidation Strategy

### When Preferences Update

1. User changes a preference (e.g., disable "sprint_updated" type)
2. `updatePreferences()` mutation succeeds
3. Hook's `useNotificationPreferences` receives new preferences data
4. Hook re-filters notifications immediately with new preferences
5. `unreadCount` and `notifications` arrays recompute
6. No server request needed for filtering

### Focus-Based Refetch

- Both underlying queries refetch on window focus
- Preference updates invalidate the notifications query
- Ensures fresh data after app regains focus

## Error Handling

```tsx
export function NotificationPanelWithErrors() {
  const {
    notifications,
    error,
    preferencesError,
    isLoading,
  } = useNotificationCenter()

  if (error) {
    return <ErrorBanner message={`Failed to load notifications: ${error.message}`} />
  }

  if (preferencesError) {
    return <ErrorBanner message="Failed to load notification preferences" />
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  )
}
```

## Advanced: Accessing Raw Unfiltered Data

For advanced use cases, the hook exposes unfiltered data:

```tsx
const {
  allNotifications,      // All notifications (no filtering applied)
  allUnreadCount,        // Unread count for all types
  notifications,         // Filtered notifications
  unreadCount,           // Filtered unread count
} = useNotificationCenter()

// Compare filtered vs unfiltered
console.log(`Showing ${notifications.length} of ${allNotifications.length} notifications`)
console.log(`Unread: ${unreadCount} enabled vs ${allUnreadCount} total`)
```

## Performance Considerations

1. **Client-side filtering** is instant (no server round-trip)
2. **Infinite scroll** works with filtered notifications
3. **Preference changes** trigger immediate recomputation
4. **Memory efficient**: only filters what's already loaded
5. **Stale-while-revalidate** reduces polling overhead

## Migration Guide

If you're currently using separate hooks:

```tsx
// Before: Using both hooks separately
const notifications = useNotifications()
const preferences = useNotificationPreferences()
const filtered = notifications.notifications.filter(n => {
  const pref = preferences.preferences?.[n.type]
  return pref?.enabled ?? true
})

// After: Using orchestration hook
const { notifications: filtered } = useNotificationCenter()
```

## Testing

Mock notifications with all supported `eventType` values:

```typescript
const mockNotifications: Notification[] = [
  {
    id: '1',
    eventType: 'assignment_changed',
    type: 'task_assigned',
    message: 'You were assigned to a task',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    eventType: 'sprint_updated',
    type: 'sprint_started',
    message: 'Sprint started',
    timestamp: new Date().toISOString(),
    read: false,
  },
  // ... more notifications
]
```

## Troubleshooting

### Notifications appear that should be filtered

- Verify preference object structure: needs `enabled` property
- Check `eventType` vs `type` field mapping
- Confirm preference update completed via `updatePreferences`

### Unread count doesn't update

- Ensure `preferences` are loaded before filtering
- Verify notification objects have `read` property
- Check that preference update propagated to cache

### Preference changes don't affect filtered list

- Confirm `useNotificationPreferences` hook is working
- Verify cache invalidation occurred on preference update
- Check console for errors in preference update mutation

## API Endpoints

### GET /api/notifications

Fetch paginated notifications with cursor-based pagination.

**Query Parameters:**
- `cursor` - Cursor token from previous response
- `limit` - Number of items per page (default: 10, max: 100)
- `unread` - Filter to unread only (`?unread=true`)
- `type` - Filter by notification type

**Response:**
```json
{
  "items": [/* Notification[] */],
  "nextCursor": "base64-token-or-null",
  "hasMore": true,
  "unreadCount": 5
}
```

### PATCH /api/notifications/:id/read

Mark a single notification as read with optimistic updates.

**Response:**
```json
{
  "id": "notif-123",
  "read": true,
  ...
}
```

### PATCH /api/notifications/read-batch

Mark multiple notifications as read.

**Request:**
```json
{
  "ids": ["notif-1", "notif-2", "notif-3"]
}
```

**Response:** `Notification[]`

### PATCH /api/notifications/dismiss-multiple

Dismiss (remove) multiple notifications at once.

**Request:**
```json
{
  "ids": ["notif-1", "notif-2", "notif-3"]
}
```

**Response:**
```json
{
  "success": true,
  "dismissedCount": 3
}
```

### DELETE /api/notifications/:id

Delete a single notification.

**Response:**
```json
{
  "success": true,
  "id": "notif-123"
}
```

### DELETE /api/notifications/clear-all

Clear all notifications at once.

**Response:**
```json
{
  "success": true,
  "clearedCount": 15
}
```

## Related Hooks

- `useNotifications`: Base hook for fetching notifications
- `useNotificationPreferences`: Hook for managing user preferences
- `useMutationWithRetry`: Retry logic for mutations
- `usePollingWithFocus`: Smart polling based on window focus
