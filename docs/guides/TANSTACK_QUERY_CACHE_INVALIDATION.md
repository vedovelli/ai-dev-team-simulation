# TanStack Query Cache Invalidation & Optimistic Updates Strategy

This guide covers cache invalidation patterns and optimistic updates in TanStack Query, essential for keeping UI state synchronized with server state.

## Cache Invalidation Strategy

### Overview

Cache invalidation is triggered when mutations occur (create, update, delete). The strategy ensures:
- Data consistency across components
- Minimal API calls
- Predictable cache behavior

### Query Key Factory Pattern

All queries use a hierarchical key structure via `src/lib/queryKeys.ts`:

```typescript
export const queryKeys = {
  all: [''] as const,

  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: { status?: string; priority?: string }) =>
      [...queryKeys.tasks.lists(), { filters }] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.tasks.details(), id] as const,
  },
}
```

This allows invalidation at different levels:
- `queryKeys.tasks.all` - Invalidates all task queries
- `queryKeys.tasks.lists()` - Invalidates all task lists
- `queryKeys.tasks.list({ status: 'done' })` - Invalidates specific filtered list
- `queryKeys.tasks.detail('123')` - Invalidates specific task

### Cache Invalidation Patterns

#### Pattern 1: Simple Invalidation (After Mutation)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTask: CreateTaskInput) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all task lists - they'll refetch automatically
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
    },
  })
}
```

#### Pattern 2: Selective Invalidation (Update Specific Entity)

```typescript
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      return response.json()
    },
    onSuccess: (data, { id }) => {
      // Invalidate this specific task detail and all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
    },
  })
}
```

#### Pattern 3: Optimistic Updates (Instant UI Feedback)

Optimistic updates immediately reflect changes in the UI while the mutation is in flight:

```typescript
export function useUpdateTaskWithOptimisticMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      return response.json()
    },

    // Called before mutation starts
    onMutate: async ({ id, updates }) => {
      // Cancel any pending refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) })
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() })

      // Snapshot previous data for rollback if needed
      const previousTask = queryClient.getQueryData<Task>(queryKeys.tasks.detail(id))
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.lists())

      // Optimistically update the detail query
      if (previousTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), {
          ...previousTask,
          ...updates,
        })
      }

      // Optimistically update all lists
      if (previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.lists(), (old) =>
          old?.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          )
        )
      }

      return { previousTask, previousTasks }
    },

    // Called if mutation fails
    onError: (error, variables, context) => {
      // Rollback to previous data
      if (context?.previousTask) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(variables.id),
          context.previousTask
        )
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousTasks)
      }
    },

    // Called on success
    onSuccess: (data, { id }) => {
      // Update with confirmed server data
      queryClient.setQueryData(queryKeys.tasks.detail(id), data)
      // Invalidate lists so next refetch gets fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
    },
  })
}
```

### CacheInvalidationManager Helper

Use the `CacheInvalidationManager` from `src/lib/cacheInvalidation.ts` for common operations:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { createCacheInvalidationManager } from '../lib/cacheInvalidation'
import { queryKeys } from '../lib/queryKeys'

export function useTaskCache() {
  const queryClient = useQueryClient()
  const cache = createCacheInvalidationManager(queryClient)

  return {
    invalidateAllTasks: () => cache.invalidateQuery(queryKeys.tasks.all),
    invalidateTaskLists: () => cache.invalidateQuery(queryKeys.tasks.lists()),
    invalidateTask: (id: string) => cache.invalidateQuery(queryKeys.tasks.detail(id)),
    refetchAllTasks: () => cache.refetchQuery(queryKeys.tasks.all),
    getTask: (id: string) => cache.getQueryData<Task>(queryKeys.tasks.detail(id)),
    setTask: (id: string, data: Task) =>
      cache.setQueryData(queryKeys.tasks.detail(id), data),
    clearCache: () => cache.clearCache(),
  }
}
```

## Optimistic Updates Pattern

### Core Concept

Optimistic updates provide instant UI feedback while mutations complete:

1. **onMutate**: Snapshot current data and immediately update cache
2. **onSuccess**: Confirm with server response (usually already matches)
3. **onError**: Rollback to snapshot if mutation fails

### Example: Complete Task Form

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'

interface UpdateTaskInput {
  id: string
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'normal' | 'high'
}

export function useUpdateTaskOptimistically() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const response = await fetch(`/api/tasks/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!response.ok) throw new Error('Failed to update task')
      return response.json()
    },

    onMutate: async (input) => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(input.id) })

      // Get current data
      const previous = queryClient.getQueryData<Task>(queryKeys.tasks.detail(input.id))

      // Update optimistically
      if (previous) {
        queryClient.setQueryData(queryKeys.tasks.detail(input.id), {
          ...previous,
          title: input.title,
          status: input.status,
          priority: input.priority,
        })
      }

      return { previous }
    },

    onError: (error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(input.id),
          context.previous
        )
      }
      console.error('Update failed:', error.message)
    },

    onSuccess: (data) => {
      // Server confirmed, update with actual response
      queryClient.setQueryData(queryKeys.tasks.detail(data.id), data)
    },
  })
}
```

### Usage in Components

```typescript
import { useUpdateTaskOptimistically } from '../hooks/mutations'

export function TaskForm({ taskId }: { taskId: string }) {
  const mutation = useUpdateTaskOptimistically()

  const handleSubmit = (formData: UpdateTaskInput) => {
    mutation.mutate({ ...formData, id: taskId })
  }

  return (
    <form onSubmit={handleSubmit}>
      {mutation.isError && <div className="error">{mutation.error?.message}</div>}
      {mutation.isPending && <div className="loading">Saving...</div>}
      {/* form fields */}
      <button disabled={mutation.isPending} type="submit">
        Save Task
      </button>
    </form>
  )
}
```

## Best Practices

### 1. Always Use Query Key Factory

✅ **Good**:
```typescript
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
```

❌ **Bad**:
```typescript
queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] })
```

### 2. Invalidate Hierarchically

After creating a task, invalidate the list, not individual items:

```typescript
// Updates list and causes refetch
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })

// Not necessary - will be included in list refetch
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(newId) })
```

### 3. Use Optimistic Updates for Perceived Performance

Optimistic updates make the app feel instant, but only for operations you're confident about:

✅ **Good for**: Toggle boolean, update status in list, increment counter
❌ **Not for**: Complex calculations, validation-dependent operations

### 4. Always Return Context from onMutate

```typescript
onMutate: async (input) => {
  const previous = queryClient.getQueryData(/* ... */)
  // ...
  return { previous } // Return for onError rollback
}
```

### 5. Handle Network Errors Gracefully

```typescript
onError: (error, variables, context) => {
  // Rollback if needed
  if (context?.previous) {
    queryClient.setQueryData(/* ... */, context.previous)
  }
  // Show user-friendly error
  toast.error(`Update failed: ${error.message}`)
},
```

## Testing Cache Invalidation

See [MSW Documentation](./msw-documentation.md) for testing strategies with mock handlers.

## Configuration

Cache defaults are configured in `src/lib/queryClient.ts`:

```typescript
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
        gcTime: 1000 * 60 * 10, // Keep unused data for 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })
}
```

These settings optimize for:
- **Less server load**: Minimal refetches with longer staleTime
- **Better UX**: No refetches on blur/focus/reconnect
- **Data consistency**: Manual invalidation when needed
