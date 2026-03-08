# Notification/Toast System Implementation

This guide covers the notification system for showing transient feedback to users when mutations complete.

## Overview

The notification system provides a composable, accessible way to display temporary messages (success, error, warning, info) tied to user actions, primarily mutations. It integrates with TanStack Query for seamless feedback on async operations.

## Components

### 1. Toast Provider (`src/components/Toast.tsx`)

The base toast infrastructure with context-based management. Already integrated in the app root.

**Features:**
- Queue management (stack multiple toasts)
- Auto-dismiss after 5 seconds (configurable)
- Escape key support to dismiss all
- Click to dismiss individual toast
- Accessible with aria-live regions
- Smooth animations (slide in/out)

### 2. useNotification Hook (`src/hooks/useNotification.ts`)

The primary hook for showing notifications in components.

**API:**
```typescript
const {
  notify,           // show(message, type, timeout)
  success,          // show success notification
  error,            // show error notification
  warning,          // show warning notification
  info,             // show info notification
  dismiss,          // manually dismiss by id
  notifications,    // current queue
  count             // number of active toasts
} = useNotification({ defaultTimeout: 5000 })
```

**Example Usage:**
```tsx
import { useNotification } from '@/hooks'

function MyComponent() {
  const { success, error } = useNotification()

  const handleSave = async () => {
    try {
      await api.save(data)
      success('Changes saved!')
    } catch (err) {
      error('Failed to save')
    }
  }

  return <button onClick={handleSave}>Save</button>
}
```

### 3. useTaskWithNotifications Hook (`src/hooks/useTaskWithNotifications.ts`)

Proof of concept showing mutation integration. Wraps task mutations with automatic notifications.

**Example:**
```tsx
const { create, update, delete: deleteTask } = useTaskWithNotifications()

// Automatically shows success/error notifications
create.mutate({ name: 'New task', ... })
update.mutate({ id: '123', data: { status: 'done' } })
deleteTask.mutate('123')
```

### 4. NotificationProvider (`src/components/NotificationProvider.tsx`)

Simple wrapper for easier provider setup. Already included via ToastProvider in root route.

## Accessibility

All notifications are accessible:
- **aria-live="polite"**: Changes announced to screen readers
- **role="status"**: Semantic alert role
- **aria-atomic="true"**: Entire message announced
- **Keyboard dismissible**: Escape key dismisses all toasts, Enter/Space on individual toast
- **Visual indicators**: Icons and color-coded types (success/error/warning/info)

## Integration with Mutations

### Pattern 1: Direct Integration

```tsx
const { success, error } = useNotification()
const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => success('Task created!'),
  onError: (err) => error(err.message)
})
```

### Pattern 2: Wrapped Mutations (useTaskWithNotifications)

```tsx
const { create, update, delete } = useTaskWithNotifications()

// Notifications handled automatically
create.mutate(data)
```

## Query Integration

Notifications automatically reflect mutation state and query cache updates through:
1. `onSuccess` callbacks showing success messages
2. `onError` callbacks showing error messages
3. Query invalidation triggers refetch feedback
4. Optimistic updates provide instant feedback

## Configuration

### Custom Timeouts

```tsx
const { success } = useNotification({ defaultTimeout: 3000 })

// Override per notification
success('Quick message', 2000)
success('Persistent message', 0) // never auto-dismiss
```

### Type Variants

- `success`: Green, checkmark icon
- `error`: Red, X icon
- `warning`: Amber, warning icon
- `info`: Blue, info icon

## Styling

Notifications use Tailwind CSS with:
- Fixed positioning (bottom-right)
- z-50 for top-level visibility
- Smooth animations (300ms transitions)
- Color-coded backgrounds and borders
- Hover effects for interactivity

Escape key hint is shown on each toast: "Press Escape to dismiss all"

## Best Practices

1. **Use for transient feedback**: Mutations, form submissions, async actions
2. **Keep form validation inline**: Use form-level errors, not toasts
3. **Be specific with messages**: "Task updated" vs "Success"
4. **Don't overuse**: Too many notifications reduce effectiveness
5. **Consider context**: Some actions don't need confirmation toasts
6. **Test accessibility**: Ensure messages work with screen readers

## Type Safety

Full TypeScript support:
```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  message: string
  type: NotificationType
  timeout?: number
}

interface UseNotificationOptions {
  defaultTimeout?: number
}
```

## Future Enhancements

Possible extensions:
- Custom notification components
- Position configuration (top, bottom, left, right)
- Sound/haptic feedback
- Notification history persistence
- Grouped notifications by type
- Action buttons in toasts (undo, retry, etc.)
- Integration with form libraries (TanStack Form)
