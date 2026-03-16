# NotificationCacheManager — Cross-Feature Cache Coordination

## Overview

`NotificationCacheManager` is a utility that coordinates TanStack Query cache invalidation across the notifications, tasks, and preferences domains. It prevents stale data when notification state changes ripple through the rest of the app.

## Problem It Solves

When working with multiple interconnected domains (notifications, tasks, preferences), cache invalidation becomes complex:

- **Task Update → Stale Notifications**: When a task is updated, the notification feed may show outdated task state
- **Preference Change → Stale Filters**: When notification preferences change, the notifications list still shows disabled types
- **Mark as Read → Unread Count Desync**: When a notification is marked read, unread counts in other components don't sync

Each feature was handling invalidation ad-hoc, leading to inconsistent behavior. `NotificationCacheManager` provides a single, well-tested coordinator.

## Architecture

`NotificationCacheManager` follows the same pattern as `CacheInvalidationManager` (FAB-60), scoped to the notifications domain:

```
CacheInvalidationManager (generic)
├── QueryClient wrapper
├── Generic invalidation methods
└── Used across codebase

NotificationCacheManager (specific)
├── QueryClient wrapper
├── Domain-specific methods
└── Coordinated cache operations
```

## API Reference

### Class: NotificationCacheManager

#### Constructor

```typescript
constructor(queryClient: QueryClient)
```

#### Methods

##### `invalidateOnPreferenceChange(): Promise<void>`

Invalidates the notifications query when user preferences change.

**Usage:**
```typescript
await manager.invalidateOnPreferenceChange()
```

**Behavior:**
- Calls `queryClient.invalidateQueries(['notifications'])`
- Prevents showing notifications of disabled types
- Refetches immediately (refetchType: 'active')

---

##### `invalidateOnTaskUpdate(taskId: string): Promise<void>`

Invalidates both task detail and notifications queries when a task is updated.

**Usage:**
```typescript
await manager.invalidateOnTaskUpdate('task-123')
```

**Behavior:**
- Invalidates `['tasks', taskId]`
- Invalidates `['notifications']`
- Ensures notification feed reflects latest task state
- Runs both invalidations in parallel

---

##### `filterDisabledNotifications(notifications: Notification[], preferences: NotificationPreferences): Notification[]`

Pure function that filters out notifications whose type is disabled in user preferences.

**Usage:**
```typescript
const filtered = manager.filterDisabledNotifications(allNotifications, preferences)
```

**Parameters:**
- `notifications`: Array of notification objects
- `preferences`: User's complete notification preferences

**Returns:** Filtered array containing only notifications with enabled types

**Behavior:**
- Pure function with no side effects
- Checks each notification's type against preferences
- Keeps notifications with unknown types (safe default)
- Returns filtered array

---

##### `syncUnreadCount(): number`

Recomputes unread count from current cache without refetch.

**Usage:**
```typescript
const unreadCount = manager.syncUnreadCount()
```

**Returns:** Number of unread notifications

**Behavior:**
- Reads from `['notifications', { unreadOnly: false }]` cache
- Aggregates unread count across all loaded pages
- Returns 0 if no cached data
- Does not trigger any network requests

## Hook: useNotificationCacheManager

### Usage

```typescript
import { useNotificationCacheManager } from '@/hooks'

function MyComponent() {
  const {
    invalidateOnPreferenceChange,
    invalidateOnTaskUpdate,
    filterDisabledNotifications,
    syncUnreadCount,
  } = useNotificationCacheManager()

  return (
    // Component that uses these methods
  )
}
```

### Benefits

- Automatically binds to component's `queryClient` via `useQueryClient()`
- Clean API with all methods bound
- Type-safe with full TypeScript support
- Composable with other TanStack Query hooks

## Query Keys Coordinated

The manager coordinates these query keys:

- `['notifications']` — Main notifications list (FAB-179)
  - Format: `['notifications', { unreadOnly: false }]`
  - Infinite query with cursor-based pagination
  - 30s stale time, 2min gc time

- `['notificationPreferences']` — User notification preferences (FAB-188)
  - Single query
  - 5min stale time, 10min gc time

- `['tasks', taskId]` — Individual task details
  - Invalidated when tasks update
  - Ensures notifications reflect task state

- `['sprints', sprintId, 'metrics']` — Sprint metrics (FAB-95)
  - Coordinated for sprint-related notifications

## Integration Examples

### 1. Update Task and Sync Notifications

```typescript
function TaskUpdateForm({ taskId, onSuccess }) {
  const updateTask = useUpdateTask()
  const { invalidateOnTaskUpdate } = useNotificationCacheManager()

  const handleSubmit = async (data) => {
    try {
      await updateTask.mutateAsync({ id: taskId, ...data })
      await invalidateOnTaskUpdate(taskId)
      onSuccess()
    } catch (error) {
      // Handle error
    }
  }

  return (
    // Form JSX
  )
}
```

### 2. Update Preferences and Filter Notifications

```typescript
function NotificationPreferencesPanel() {
  const preferences = useNotificationPreferences()
  const notifications = useNotifications()
  const { invalidateOnPreferenceChange, filterDisabledNotifications } = useNotificationCacheManager()

  const handlePreferenceChange = async (updates) => {
    try {
      await preferences.updateMutation.mutateAsync(updates)
      await invalidateOnPreferenceChange()
    } catch (error) {
      // Handle error
    }
  }

  // Apply client-side filtering while invalidation happens
  const visibleNotifications = filterDisabledNotifications(
    notifications.data?.pages[0]?.items ?? [],
    preferences.data ?? {}
  )

  return (
    // Panel JSX
  )
}
```

### 3. Get Unread Count from Cache

```typescript
function NotificationBadge() {
  const { syncUnreadCount } = useNotificationCacheManager()

  // Get unread count from cache without refetch
  const unreadCount = syncUnreadCount()

  return (
    <div className="badge">
      {unreadCount > 0 && <span>{unreadCount}</span>}
    </div>
  )
}
```

## Testing

Unit tests cover all pure functions:

```bash
npm run test src/utils/__tests__/notification-cache-manager.test.ts
```

Key test scenarios:
- ✅ Invalidating queries on preference change
- ✅ Invalidating task and notification queries
- ✅ Filtering disabled notification types
- ✅ Counting unread across multiple pages
- ✅ Handling edge cases (empty cache, all disabled, unknown types)

## Performance Considerations

### `syncUnreadCount()`

- **Complexity:** O(n) where n = total notifications in cache
- **Performance:** Very fast (cache reads, no I/O)
- **Best for:** Badge updates, counts in UI
- **Avoid:** High-frequency updates (>1/sec) in rapid loops

### `invalidateOnPreferenceChange()`

- **Network impact:** Triggers refetch of first notification page
- **Stale time:** 30s (notifications don't refetch if stale < 30s)
- **Best for:** Preference panel save actions
- **Note:** Should be called once per preference save, not per field change

### `invalidateOnTaskUpdate()`

- **Parallel invalidations:** Runs task + notification invalidations in parallel
- **Network impact:** May trigger 2 refetches
- **Best for:** Task save operations
- **Note:** Only called after successful task update

## Migration from Ad-Hoc Invalidation

**Before:**
```typescript
const handleTaskUpdate = async (updates) => {
  await updateTask.mutateAsync(updates)
  // Ad-hoc invalidation spread across code
  await queryClient.invalidateQueries(['tasks', taskId])
  await queryClient.invalidateQueries(['notifications'])
}
```

**After:**
```typescript
const handleTaskUpdate = async (updates) => {
  const { invalidateOnTaskUpdate } = useNotificationCacheManager()
  await updateTask.mutateAsync(updates)
  await invalidateOnTaskUpdate(taskId) // Clear, coordinated
}
```

## Related Features

- **FAB-179**: Notifications query hook and real-time polling
- **FAB-188**: Notification preferences hook and update mutations
- **FAB-60**: CacheInvalidationManager pattern (reference implementation)
- **FAB-95**: Sprint metrics with polling pattern

## Files

- `src/utils/notification-cache-manager.ts` — Manager class and factory
- `src/hooks/useNotificationCacheManager.ts` — React hook
- `src/utils/__tests__/notification-cache-manager.test.ts` — Unit tests
- `src/docs/notification-cache-manager-implementation.md` — This file

## Future Enhancements

Potential improvements (not in scope for FAB-269):

- [ ] Batch operation support (invalidate multiple tasks at once)
- [ ] Cache normalization helpers
- [ ] Performance metrics tracking
- [ ] Integration with WebSocket real-time updates
