# Mutation Notification Feedback Pattern

## Overview

This document describes the pattern for integrating mutation feedback (success/error notifications) into TanStack Query mutation hooks using the existing `useNotifications` data layer.

## Architecture

Rather than introducing a separate toast or notification UI system, we inject transient notifications directly into the TanStack Query notification cache (`['notifications']`). This keeps notification state unified and allows the existing notification center to display mutation feedback alongside other app events.

### Benefits

- **Unified State**: All notifications (real-time + mutations) live in one TanStack Query cache
- **Optimistic Updates**: Notifications appear instantly without server round-trip
- **Auto-Expiration**: 5-second lifecycle prevents notification clutter
- **Type Safety**: Full TypeScript support with structured notification types
- **Caller Flexibility**: Optional `onSuccess`/`onError` callbacks allow message overrides

## Implementation Pattern

### 1. Helper Function: `injectTransientNotification`

Every mutation hook that emits notifications uses the same helper:

```typescript
function injectTransientNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  notification: Notification
): void {
  // Inject at the top of the infinite query cache (first page)
  queryClient.setQueryData(
    ['notifications', { unreadOnly: false }],
    (oldData: any) => {
      if (!oldData?.pages) return oldData
      return {
        ...oldData,
        pages: [
          {
            ...oldData.pages[0],
            items: [notification, ...(oldData.pages[0]?.items ?? [])],
            unreadCount: (oldData.pages[0]?.unreadCount ?? 0) + (notification.read ? 0 : 1),
          },
          ...(oldData.pages.slice(1) ?? []),
        ],
      }
    }
  )

  // Auto-expire after 5 seconds
  setTimeout(() => {
    queryClient.setQueryData(
      ['notifications', { unreadOnly: false }],
      (oldData: any) => {
        // Remove notification by ID
        // Adjust unreadCount based on original read state
      }
    )
  }, 5000)
}
```

**Key Design Choices:**

- Notifications are `read: true` so they don't affect unread count
- They're prepended to the first page (newest first)
- IDs are auto-generated (`success-${Date.now()}-${Math.random()}`) to avoid collisions
- Timeout cleanup removes the notification from cache

### 2. Hook Configuration: Success/Error Callbacks

Mutation hooks accept optional callbacks for customization:

```typescript
export interface UseUpdateTaskOptions {
  onSuccess?: (data: Task, messageOverride?: string) => void
  onError?: (error: Error, messageOverride?: string) => void
}
```

The callbacks are optional — if not provided, default messages are used.

### 3. Notification Structure

All mutation notifications follow the `Notification` interface:

```typescript
const successNotification: Notification = {
  id: `success-${Date.now()}-${Math.random()}`,
  type: 'task_reassigned', // or 'assignment_changed'
  message: 'Task updated', // customizable
  timestamp: new Date().toISOString(),
  read: true, // don't count toward unread
  priority: 'normal', // or 'high' for errors
  metadata: {
    entityId: taskId,
    entityType: 'task',
    source: 'task-mutation',
  },
}
```

## Implemented Hooks

### `useUpdateTask`

**File:** `src/hooks/useUpdateTask.ts`

Emits notifications for task update operations:

- **Success**: `"Task updated"` (type: `task_reassigned`)
- **Error**: `"Failed to update task"` (type: `task_reassigned`)

```typescript
const { mutate } = useUpdateTask({
  onSuccess: (data) => {
    // Custom logic after update
  },
  onError: (error) => {
    // Custom error handling
  },
})

await mutate({ id: 'task-1', data: { title: 'New Title' }, version: 1 })
```

### `useTaskAssignment`

**File:** `src/hooks/useTaskAssignment.ts`

Emits notifications for both assign and unassign operations:

#### Assign Success
- Message: `"Task assigned to agent"`
- Type: `assignment_changed`
- Metadata includes `actor` (agentId)

#### Assign Error
- Message: `"Agent capacity limit reached"` or `"Failed to assign task"`
- Type: `assignment_changed`
- Priority: `high`

#### Unassign Success
- Message: `"Task unassigned"`
- Type: `assignment_changed`

#### Unassign Error
- Message: `"Failed to unassign task"`
- Type: `assignment_changed`
- Priority: `high`

```typescript
const { assign, unassign } = useTaskAssignment({
  onAssignSuccess: (data) => { /* ... */ },
  onAssignError: (error) => { /* ... */ },
  onUnassignSuccess: (data) => { /* ... */ },
  onUnassignError: (error) => { /* ... */ },
})

await assign({ taskId: 'task-1', agentId: 'agent-1' })
await unassign({ taskId: 'task-1' })
```

## Query Cache Structure

Notifications are injected into the infinite query cache:

```
Query Key: ['notifications', { unreadOnly: false }]
Structure: {
  pages: [
    {
      items: [Notification[], // newest first, includes mutations
      nextCursor: string | null,
      hasMore: boolean,
      unreadCount: number
    },
    // additional pages...
  ],
  pageParams: [null, ...]
}
```

Because mutations are marked as `read: true`, they don't contribute to `unreadCount`.

## Design Decisions

### 1. Why Not a Global `useNotificationQueue` Abstraction Yet?

We validated the pattern in 2-3 concrete hooks first. Both `useUpdateTask` and `useTaskAssignment` follow the same approach, but creating a reusable abstraction would require:

- Decision on where to place `injectTransientNotification` (shared hook util)
- Typed message configuration (per-hook strings defined elsewhere)
- Consideration of non-TanStack Query use cases

**Verdict:** The pattern is sound and can be extended to other mutation hooks (e.g., `useCreateTask`, `useBulkUpdateTasks`). If 3+ hooks use it with identical logic, extract a `useNotificationQueue` abstraction.

### 2. Why 5-Second Expiration?

- Long enough to be readable (~3-4 seconds to read "Task updated")
- Short enough to prevent clutter (users don't expect persistent task notifications)
- Matches typical toast notification timeouts (e.g., Sonner default is 4s)

### 3. Why Mark as Read (`read: true`)?

Mutation notifications are ephemeral feedback, not important events. Marking them as read:
- Prevents unread badge inflation
- Keeps the notification center focused on important app events
- Can be revisited if mutation notifications need persistence

### 4. Why Inject into First Page Only?

The infinite query loads pages lazily. Injecting into the first page ensures:
- Mutations appear instantly without pagination complexity
- No wasted API calls to refresh stale pages
- Aligns with notification center UX (newest first)

## Testing Strategy

Each hook should have tests for:

1. **Success Path**: Notification injected and auto-expires
2. **Error Path**: Error notification injected with appropriate message
3. **Message Override**: Custom `onSuccess`/`onError` callbacks are called
4. **Cache State**: Notifications don't affect `unreadCount`
5. **Auto-Expiration**: Notification removed after 5 seconds

## Future Enhancements

### Potential Extraction

If 3+ mutation hooks use this pattern, extract:

```typescript
// src/hooks/useNotificationQueue.ts
export function useNotificationQueue() {
  const queryClient = useQueryClient()

  return {
    injectSuccess: (message: string, metadata?: NotificationMetadata) => {
      injectTransientNotification(queryClient, { /* ... */ })
    },
    injectError: (message: string, metadata?: NotificationMetadata) => {
      injectTransientNotification(queryClient, { /* ... */ })
    },
  }
}
```

Then mutations become:

```typescript
const notificationQueue = useNotificationQueue()

onSuccess: () => {
  notificationQueue.injectSuccess('Task updated', { entityId, entityType: 'task' })
}
```

### Structured Error Messages

Define error message maps per hook:

```typescript
const UPDATE_TASK_ERRORS: Record<string, string> = {
  'conflict': 'Task was updated elsewhere',
  'not-found': 'Task no longer exists',
  'permission': 'You lack permission to update',
  'default': 'Failed to update task',
}
```

### Toast Notification Alternative

If the app later needs toast notifications for non-TanStack Query events (e.g., form validation), consider a parallel system that syncs with the notification center, rather than a separate toast system.

## Conclusion

This pattern validates that mutation feedback can live in the same TanStack Query cache as real-time notifications, reducing state fragmentation and providing a unified notification experience. The pattern is production-ready for the two implemented hooks and easily extensible to other mutations.
