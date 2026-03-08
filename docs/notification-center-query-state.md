# Notification Center with Query-Based State (FAB-160)

## Overview

The Notification Center provides a centralized in-app notification system that stores notifications in TanStack Query's cache. This separates user feedback notifications from server-backed notifications, reducing prop drilling and providing a single source of truth for transient UI feedback.

## Architecture

### Two-Layer Notification System

1. **Server-Backed Notifications** (`useNotifications`)
   - Persistent notifications stored on server
   - Polling-based updates every 30 seconds
   - WebSocket real-time updates
   - Used for user-visible notification center in dropdown

2. **App Notifications** (`useAppNotifications`)
   - In-app transient notifications
   - Query-based cache state (no API calls)
   - Auto-dismiss toasts
   - Manual dismiss capability
   - Used for operation feedback (success, error, warning, info)

## Core Components

### `useAppNotifications` Hook

Custom hook for managing in-app notifications using TanStack Query.

```typescript
import { useAppNotifications } from '@/hooks'

const {
  notifications,
  addNotification,
  dismiss,
  clearAll,
  success,
  error,
  warning,
  info,
  count
} = useAppNotifications()
```

#### Features

- **Query-based State**: Notifications stored in Query cache
- **Auto-dismiss**: Configurable timeout per notification (default 5 seconds)
- **Stacking**: Multiple notifications display together
- **Manual Dismiss**: Users can dismiss individual notifications
- **Optimistic Updates**: Instant feedback with automatic rollback on error
- **Type-safe**: Full TypeScript support with AppNotification interface

#### Query Cache Configuration

- **Query Key**: `['app-notifications']`
- **Stale Time**: `Infinity` (never stale - manually managed)
- **GC Time**: 5 minutes
- **Refetch**: Only if auto-cleanup enabled

### `AppNotificationCenter` Component

Sidebar panel displaying all active notifications.

```typescript
import { AppNotificationCenter } from '@/components/AppNotificationCenter'

// In root layout
<AppNotificationCenter />
```

#### Features

- **Auto-hide**: Only displays when notifications exist
- **Sidebar Display**: Fixed right sidebar (width: 320px)
- **Dismiss All**: Clear all notifications with one click
- **Individual Dismiss**: Each notification has close button
- **Type Icons**: Visual indicators for success/error/warning/info
- **Accessible**: ARIA labels, semantic HTML

### `AppNotificationItem` Component

Individual notification item with type-specific styling.

## Usage Patterns

### Basic Success Notification

```typescript
const { success } = useAppNotifications()

// Show success notification (auto-dismiss in 5 seconds)
success('Task created successfully!')
```

### Error with No Auto-Dismiss

```typescript
const { error } = useAppNotifications()

// Show error notification (no auto-dismiss, user must close)
error('Failed to create task')
```

### Custom Duration

```typescript
const { info } = useAppNotifications()

// Show info notification (auto-dismiss in 3 seconds)
info('Processing...', 3000)
```

### With Action Button

```typescript
const { addNotification } = useAppNotifications()

addNotification({
  type: 'warning',
  message: 'Unsaved changes',
  dismissible: true,
  action: {
    label: 'Save Now',
    onClick: () => handleSave()
  }
})
```

### Mutation Integration

Integrate with TanStack Query mutations for automatic error notifications:

```typescript
const { error: showError } = useAppNotifications()
const mutation = useMutation({
  mutationFn: createTask,
  onError: (err) => {
    showError(err.message)
  }
})
```

## Notification Entity

```typescript
interface AppNotification {
  id: string                    // Auto-generated unique ID
  type: 'success'              // 'success' | 'error' | 'warning' | 'info'
       | 'error'
       | 'warning'
       | 'info'
  message: string              // Notification text
  action?: {                    // Optional action button
    label: string
    onClick: () => void
  }
  dismissible: boolean          // User can dismiss manually
  createdAt: string             // ISO timestamp
  duration?: number             // Auto-dismiss timeout (ms, default 5000)
}
```

## Integration with Mutations

### Pattern 1: Error Feedback

```typescript
const { error } = useAppNotifications()

const createTaskMutation = useMutation({
  mutationFn: createTask,
  onError: (error) => {
    error(`Failed to create task: ${error.message}`)
  }
})
```

### Pattern 2: Success + Error Feedback

```typescript
const { success, error } = useAppNotifications()

const updateTaskMutation = useMutation({
  mutationFn: updateTask,
  onSuccess: () => {
    success('Task updated successfully')
  },
  onError: (error) => {
    error(error.message)
  }
})
```

### Pattern 3: With Action (Undo Example)

```typescript
const { warning } = useAppNotifications()
const queryClient = useQueryClient()

const deleteMutation = useMutation({
  mutationFn: deleteTask,
  onSuccess: (_, variables) => {
    warning('Task deleted', {
      dismissible: true,
      duration: 0,
      action: {
        label: 'Undo',
        onClick: () => {
          // Revert deletion
          queryClient.setQueryData(
            ['tasks', variables.id],
            variables
          )
        }
      }
    })
  }
})
```

## Acceptance Criteria Met

- ✅ Notifications appear as toast in bottom-right corner (via ToastProvider)
- ✅ Toast auto-dismisses based on configurable duration field (default 5s)
- ✅ NotificationCenter sidebar shows persistent notifications
- ✅ Mutation errors automatically create error notifications
- ✅ System handles multiple notifications gracefully (queue/stack behavior)

## Key Design Decisions

1. **Query-Based State**: Using TanStack Query for notifications provides:
   - Consistent state management
   - No prop drilling
   - Automatic cache cleanup
   - Dev tools integration

2. **Two-Layer System**: Separating app notifications from server notifications:
   - App notifications: transient, immediate feedback
   - Server notifications: persistent, important updates
   - Clear separation of concerns

3. **Optional Duration**: Flexible dismissal:
   - Success: auto-dismiss (5s)
   - Warning: auto-dismiss (5s)
   - Error: manual dismiss (duration = 0)
   - Info: auto-dismiss (5s)

4. **Sidebar Sidebar Display**: Persistent notifications in sidebar allows:
   - User to review while working
   - Multiple notifications visible at once
   - Time to take action on warnings/errors

## Testing

### Unit Test Example

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAppNotifications } from '@/hooks'

describe('useAppNotifications', () => {
  it('should add notification with auto-dismiss', async () => {
    const { result } = renderHook(() => useAppNotifications())

    act(() => {
      result.current.success('Operation successful')
    })

    expect(result.current.count).toBe(1)
    expect(result.current.notifications[0].message).toBe('Operation successful')

    // Wait for auto-dismiss
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5100))
    })

    expect(result.current.count).toBe(0)
  })
})
```

## Performance Considerations

- **Cache Efficiency**: Only one query key `['app-notifications']`
- **GC Cleanup**: Automatic garbage collection after 5 minutes
- **No API Calls**: Purely client-side state
- **Optimistic Updates**: Instant UI feedback
- **Lightweight**: Minimal bundle impact

## Future Enhancements

1. Notification history/archive
2. Persistent notification storage (localStorage)
3. Notification categories/filtering
4. Sound/desktop notifications
5. Notification preferences UI
6. Integration with error boundary
7. Performance metrics notifications

## Related Documentation

- [TanStack Query Patterns](./tanstack-query-patterns.md)
- [Mutation Error Handling](./mutation-patterns.md)
- [Component Architecture](./architecture.md)
