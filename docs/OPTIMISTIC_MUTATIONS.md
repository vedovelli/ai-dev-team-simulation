# Optimistic Mutations with Rollback

## Overview

`useOptimisticMutation` is a reusable wrapper around TanStack Query's `useMutation` that implements optimistic updates with automatic rollback on failure. This hook provides a production-ready pattern for building responsive UIs that update immediately while mutations are pending.

## Key Features

- **Immediate Optimistic Updates**: Cache is updated instantly before server response
- **Automatic Rollback**: Previous state is restored if mutation fails
- **Type-Safe**: Full TypeScript generic support for variables, responses, and errors
- **Flexible Invalidation**: Support for single or batch query invalidation
- **Error Handling**: Built-in error callbacks with automatic rollback
- **Batch Updates**: Supports updating multiple related queries

## Basic Usage

### Simple Update

```tsx
import { useOptimisticMutation } from '@/hooks'

function TaskComponent({ taskId }: { taskId: string }) {
  const { mutate, isPending } = useOptimisticMutation({
    mutationFn: async (status) => {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      return res.json()
    },

    optimisticUpdate: (newStatus, currentData) => ({
      ...currentData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }),

    queryKey: ['task', taskId],
  })

  return (
    <button
      onClick={() => mutate('done')}
      disabled={isPending}
    >
      {isPending ? 'Updating...' : 'Mark Done'}
    </button>
  )
}
```

### With Invalidation

```tsx
const { mutate } = useOptimisticMutation({
  mutationFn: updateTaskAPI,
  optimisticUpdate: (variables, current) => ({ ...current, ...variables }),
  queryKey: ['task', taskId],

  // Invalidate related queries on success
  invalidateKeys: (data, variables) => [
    ['task', taskId],
    ['sprint', variables.sprintId, 'tasks'],
    ['sprint', variables.sprintId, 'metrics'],
  ],
})
```

## Advanced Patterns

### Pattern 1: Update with Status Tracking

```tsx
function TaskStatusUpdater({ task, sprintId }: Props) {
  const { mutate, isPending, isError, error } = useOptimisticMutation({
    mutationFn: async (status) => {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      return res.json()
    },

    optimisticUpdate: (status, current) => ({
      ...current,
      status,
      updatedAt: new Date().toISOString(),
    }),

    queryKey: ['task', task.id],

    invalidateKeys: () => [
      ['sprint', sprintId, 'tasks'],
      ['sprint', sprintId, 'metrics'],
    ],

    onSuccess: (data) => {
      toast.success(`Task updated to ${data.status}`)
    },

    onError: (error) => {
      toast.error(`Failed: ${error.message}`)
    },
  })

  return (
    <>
      <select
        value={task.status}
        onChange={(e) => mutate(e.target.value)}
        disabled={isPending}
      >
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      {isError && <span className="error">{error.message}</span>}
    </>
  )
}
```

### Pattern 2: Batch Updates

```tsx
const { mutate } = useOptimisticMutation({
  mutationFn: async (updates) => {
    const res = await fetch('/api/tasks/batch-update', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    return res.json()
  },

  optimisticUpdate: (updates, currentData) => {
    // Apply updates to array of tasks
    return currentData.map(task =>
      updates[task.id] ? { ...task, ...updates[task.id] } : task
    )
  },

  queryKey: ['sprint', sprintId, 'tasks'],

  invalidateKeys: () => [
    ['sprint', sprintId, 'metrics'],
    ['dashboard'],
  ],
})

// Usage
mutate({
  'task-1': { status: 'done' },
  'task-2': { status: 'in-progress' },
})
```

### Pattern 3: Cascading Invalidations

```tsx
const { mutate } = useOptimisticMutation({
  mutationFn: updateSprintVelocity,

  optimisticUpdate: (velocity, current) => ({
    ...current,
    velocity,
  }),

  queryKey: ['sprint', sprintId],

  invalidateKeys: (data, variables) => [
    // Current sprint
    ['sprint', variables.sprintId],
    // Sprint metrics (affects velocity, burndown)
    ['sprint', variables.sprintId, 'metrics'],
    // Agent capacity (depends on sprint velocity)
    ['agents', 'capacity'],
    // Dashboards
    ['dashboard', 'team-performance'],
    ['dashboard', 'forecasting'],
  ],
})
```

## API Reference

### useOptimisticMutation

```tsx
function useOptimisticMutation<TData, TError, TVariables, TContext>(
  options: UseOptimisticMutationOptions<TData, TError, TVariables, TContext>
): UseOptimisticMutationResult<TData, TError, TVariables>
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `mutationFn` | `(variables: TVariables) => Promise<TData>` | Yes | Function to call on the server |
| `optimisticUpdate` | `(variables: TVariables, currentData?: TData) => TData` | Yes | Function to compute optimistic data |
| `queryKey` | `(string \| number \| object)[]` | Yes | Cache key to update |
| `invalidateKeys` | `(data: TData, variables: TVariables) => QueryKey[]` | No | Custom invalidation strategy |
| `onSuccess` | `(data: TData, variables: TVariables, context: TContext) => void` | No | Success callback |
| `onError` | `(error: TError, variables: TVariables, context: TContext) => void` | No | Error callback |
| `...mutationOptions` | `UseMutationOptions<...>` | No | Other TanStack Query mutation options |

#### Result

| Property | Type | Description |
|----------|------|-------------|
| `mutate` | `(variables: TVariables) => void` | Trigger mutation |
| `mutateAsync` | `(variables: TVariables) => Promise<TData>` | Trigger mutation and await |
| `isPending` | `boolean` | Mutation is in flight |
| `isError` | `boolean` | Last mutation failed |
| `error` | `TError \| null` | Error from last mutation |
| `data` | `TData \| null` | Response data from mutation |

## Implementation Details

### Optimistic Update Flow

1. **onMutate**
   - Cancel any pending queries for the key
   - Snapshot previous data for rollback
   - Apply optimistic update immediately
   - Return context for error/success handlers

2. **onError**
   - Restore previous data or invalidate
   - Call user's error callback

3. **onSuccess**
   - Set server response as authoritative
   - Invalidate related queries
   - Call user's success callback

### Type Safety

The hook uses TypeScript generics to ensure type safety across the entire flow:

```tsx
interface Task {
  id: string
  status: 'pending' | 'in-progress' | 'done'
  updatedAt: string
}

// TData = Task (response type)
// TVariables = { status: Task['status'] } (input type)
// TError = Error (error type)

useOptimisticMutation<Task, Error, { status: Task['status'] }>({
  mutationFn: async (vars) => { /* ... */ },
  optimisticUpdate: (vars, current) => { /* type-safe */ },
  // ...
})
```

## Error Handling

### Automatic Rollback

```tsx
// If mutation fails, optimistic update is reversed
const { mutate, isError } = useOptimisticMutation({
  mutationFn: updateTask, // throws error
  optimisticUpdate: (newStatus) => ({ status: newStatus }),
  queryKey: ['task', id],
  onError: (error) => {
    // Cache is already rolled back here
    console.log('Update failed, UI reverted to previous state')
  },
})
```

### Handling Missing Previous Data

```tsx
// If there's no previous data to rollback to,
// the query is invalidated instead to trigger a fresh fetch
const { mutate } = useOptimisticMutation({
  mutationFn: createNewTask,
  optimisticUpdate: (data) => data,
  queryKey: ['tasks', 'new'], // probably empty cache
  // On error: cache will be invalidated and refetched
})
```

## Testing

The hook includes comprehensive tests covering:

- ✅ Optimistic updates applied immediately
- ✅ Rollback on mutation failure
- ✅ Custom invalidation strategies
- ✅ Callback handling (onSuccess, onError)
- ✅ Mutation state (isPending, isError, data)
- ✅ Async mutations (mutateAsync)

Run tests:

```bash
npm test -- useOptimisticMutation
```

## Performance Considerations

### Cache Updates

- Optimistic updates use `setQueryData` (synchronous, instant)
- No refetch needed unless explicitly invalidated
- Respects `gcTime` settings for cleanup

### Query Cancellation

- Outgoing queries are cancelled to prevent race conditions
- Prevents optimistic data being overwritten by stale server data

### Batch Operations

When invalidating multiple queries, they're fetched in parallel:

```tsx
invalidateKeys: () => [
  ['sprint', id, 'tasks'],    // Fetches in parallel
  ['sprint', id, 'metrics'],  // Fetches in parallel
  ['dashboard'],              // Fetches in parallel
]
```

## Common Patterns

### 1. Optimistic UI with Confirmation

```tsx
const { mutate } = useOptimisticMutation({
  mutationFn: deleteTask,
  optimisticUpdate: () => null, // optimistically remove
  queryKey: ['task', id],
  onError: () => {
    // UI already reverted, just show message
    toast.error('Delete failed')
  },
})
```

### 2. Progressive Enhancement

```tsx
// First optimization: optimistic status change
mutate({ status: 'in-progress' })

// Then: more detailed update if needed
// invalidateKeys ensures full refresh
```

### 3. Cancellation Support

```tsx
const mutation = useOptimisticMutation({
  // hook already cancels pending queries
})

// Works well with AbortController for mutation cancellation
```

## Migration from useOptimisticUpdate

If migrating from the older `useOptimisticUpdate` hook:

```tsx
// Before
useOptimisticUpdate({
  optimisticData: (variables, currentData) => ({ ...currentData, ...variables }),
  queryKey: ['item'],
})

// After
useOptimisticMutation({
  optimisticUpdate: (variables, currentData) => ({ ...currentData, ...variables }),
  queryKey: ['item'],
  // Now supports invalidateKeys for related queries
})
```

The main difference is the option names and support for batched invalidations.

## Troubleshooting

### Optimistic update not appearing

- Check `queryKey` matches the cache key
- Ensure `optimisticUpdate` returns new data object
- Verify mutation has started (check `isPending`)

### Rollback not working

- Ensure no `onMutate` overrides the default behavior
- Check if query data exists before mutation
- Review error handling in `mutationFn`

### Multiple invalidations not firing

- Use `invalidateKeys` function to return array of keys
- Each key should be a full query key path
- Check React Query DevTools for invalidation events

## Related

- [TanStack Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Optimistic Updates Pattern](../patterns/optimistic-updates.md)
- [useOptimisticUpdate Hook](./useOptimisticUpdate.ts)
- [useMutationWithRetry Hook](./useMutationWithRetry.ts)
