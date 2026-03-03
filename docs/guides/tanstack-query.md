# TanStack Query Developer Guide

## Introduction

TanStack Query handles server state management including fetching, caching, and synchronization. This guide covers how to use it in this application.

## Creating New Query Hooks

### Basic Query Hook

```typescript
import { useQuery } from '@tanstack/react-query'
import type { Task } from '../types/task'

/**
 * Fetch a list of tasks
 *
 * @example
 * const { data: tasks, isLoading } = useTasks()
 */
export function useTasks() {
  const queryKey = ['tasks']

  return useQuery<Task[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await response.json()
      return data.data
    },
  })
}
```

### Query Hook with Parameters

```typescript
export interface TaskQueryParams {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  team?: string
  sprint?: string
  search?: string
}

/**
 * Fetch tasks with filters
 *
 * @param params - Filter parameters
 * @example
 * const { data: tasks } = useTasks({ status: 'in-progress', team: 'frontend' })
 */
export function useTasks(params?: TaskQueryParams) {
  const queryKey = ['tasks', params]

  return useQuery<Task[]>({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/tasks', window.location.origin)

      if (params) {
        if (params.status) url.searchParams.set('status', params.status)
        if (params.priority) url.searchParams.set('priority', params.priority)
        if (params.team) url.searchParams.set('team', params.team)
        if (params.sprint) url.searchParams.set('sprint', params.sprint)
        if (params.search) url.searchParams.set('search', params.search)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await response.json()
      return data.data
    },
  })
}
```

### Single Item Query

```typescript
/**
 * Fetch a single task by ID
 *
 * @param taskId - The task ID
 * @example
 * const { data: task } = useTask('task-123')
 */
export function useTask(taskId: string) {
  const queryKey = ['tasks', taskId]

  return useQuery<Task>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch task ${taskId}`)
      }
      return response.json()
    },
  })
}
```

### Dependent Query

```typescript
/**
 * Fetch agent history only when agentId is available
 *
 * @param agentId - The agent ID (null to disable the query)
 * @example
 * const { data: history } = useAgentHistory(selectedAgentId)
 */
export function useAgentHistory(agentId: string | null) {
  const queryKey = ['agents', agentId, 'history']

  return useQuery<HistoryEntry[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/history`)
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      return response.json()
    },
    enabled: agentId !== null, // Only run if agentId is set
  })
}
```

## Query Key Organization

Query keys are hierarchical arrays that determine caching behavior. Structure them consistently:

### Pattern: Resource Type + Identifier + Filters

```typescript
// Simple list
['tasks']

// List with filters
['tasks', { status: 'done', team: 'frontend' }]

// Single item
['tasks', taskId]

// Nested resource
['tasks', taskId, 'comments']

// Nested with filters
['agents', agentId, 'analytics', { period: 'month' }]
```

### Benefits of Hierarchy

```typescript
const queryClient = useQueryClient()

// Invalidate all task queries
queryClient.invalidateQueries({ queryKey: ['tasks'] })

// Invalidate only specific filtered tasks
queryClient.invalidateQueries({ queryKey: ['tasks', { team: 'frontend' }] })

// Invalidate a single task
queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })

// Invalidate a task and all its nested data
queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
```

### Key Organization Rules

1. **Start Broad:** First element is the resource type (`tasks`, `agents`, `sprints`)
2. **Add Identifiers:** Second element is the specific ID if querying single items
3. **Add Filters:** Include filter objects for parameterized queries
4. **Use Constants:** Define keys in one place to avoid typos

```typescript
// Use constants to prevent typos
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

// Usage
queryClient.invalidateQueries({ queryKey: taskKeys.all })
const { data } = useQuery({ queryKey: taskKeys.list({ status: 'done' }), ... })
```

## Cache Invalidation Strategies

### 1. Mutation-Driven Invalidation (Default)

Invalidate cache when data is updated:

```typescript
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all task queries so they refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

**When to use:** Most mutations (create, update, delete)

### 2. Optimistic Updates

Update UI immediately, revert on error:

```typescript
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTaskOnServer,
    onMutate: async (newTask: Task) => {
      // Cancel any pending refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Get previous data
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks'])

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old.map(t => t.id === newTask.id ? newTask : t)
      )

      // Return context for onError
      return { previousTasks }
    },
    onError: (error, newTask, context) => {
      // Revert to previous data
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    },
    onSuccess: () => {
      // Optional: refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

**When to use:** Updates that are usually successful and improve perceived performance

### 3. Time-Based Stale-While-Revalidate

Let data become stale over time, refetch in background:

```typescript
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 5 * 60 * 1000,        // Fresh for 5 minutes
    gcTime: 10 * 60 * 1000,          // Keep in cache for 10 minutes
    refetchInterval: 30 * 60 * 1000,  // Refetch every 30 minutes
  })
}
```

**When to use:** Non-critical data that changes infrequently

### 4. Manual Refetch

Allow users to refresh data:

```typescript
export function useTasksWithRefresh() {
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useTasks()

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  return { tasks, isLoading, refetch }
}

// In component:
const { tasks, refetch } = useTasksWithRefresh()
return <button onClick={refetch}>Refresh</button>
```

## Error Handling

### Basic Error Handling

```typescript
export function useTasks() {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      return response.json()
    },
  })
}

// In component
const { data: tasks, isError, error } = useTasks()

if (isError) {
  return <div>Error: {error?.message}</div>
}
```

### Retry Logic

```typescript
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    retry: 3,              // Retry up to 3 times
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
  })
}
```

### Error Recovery in Mutations

```typescript
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTaskOnServer,
    onError: (error, variables, context) => {
      // Show error to user
      console.error('Failed to create task:', error)

      // Optionally: rollback optimistic update
      // or: trigger a refetch to get latest state
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

## Advanced Patterns

### Paginated Queries

```typescript
export function usePaginatedTasks(page: number, pageSize: number) {
  const queryKey = ['tasks', 'paginated', { page, pageSize }]

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/tasks', window.location.origin)
      url.searchParams.set('page', page.toString())
      url.searchParams.set('pageSize', pageSize.toString())

      const response = await fetch(url.toString())
      return response.json()
    },
  })
}
```

### Infinite Queries

```typescript
export function useInfiniteTasks() {
  return useInfiniteQuery({
    queryKey: ['tasks', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/tasks?page=${pageParam}`)
      return response.json()
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.nextPage
    },
  })
}

// In component
const { data, fetchNextPage, hasNextPage } = useInfiniteTasks()
return (
  <>
    {data?.pages.map(page => page.items.map(item => ...))}
    {hasNextPage && <button onClick={() => fetchNextPage()}>Load More</button>}
  </>
)
```

### Prefetching Data

```typescript
export function useTaskDetail(taskId: string) {
  const queryClient = useQueryClient()

  const prefetchTask = () => {
    queryClient.prefetchQuery({
      queryKey: ['tasks', taskId],
      queryFn: () => fetchTask(taskId),
    })
  }

  return { prefetchTask }
}

// Use in a hover handler or link component
<a
  href={`/tasks/${taskId}`}
  onMouseEnter={() => prefetchTask()}
>
  Task Details
</a>
```

## Best Practices

### 1. Always Type Query Results

```typescript
// ✅ Good
const { data: tasks } = useQuery<Task[]>({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
})

// ❌ Avoid
const { data } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
})
```

### 2. Handle Loading, Error, and Success States

```typescript
const { data, isLoading, isError, error } = useTasks()

if (isLoading) return <LoadingSpinner />
if (isError) return <ErrorMessage error={error} />
return <TasksList tasks={data} />
```

### 3. Use Query Client Hooks Correctly

```typescript
// ✅ Correct: Inside component using useQueryClient()
export function MyComponent() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// ❌ Wrong: Creating queryClient manually
export function MyComponent() {
  const queryClient = new QueryClient()  // Creates new instance
  // ...
}
```

### 4. Keep Query Functions Simple

```typescript
// ✅ Good: Query function is just fetching
queryFn: async () => {
  const response = await fetch('/api/tasks')
  return response.json()
}

// ❌ Avoid: Side effects in query function
queryFn: async () => {
  const data = await fetch('/api/tasks').then(r => r.json())
  localStorage.setItem('tasks', JSON.stringify(data))  // Side effect!
  return data
}
```

### 5. Use Granular Query Keys

```typescript
// ✅ Good: Allows granular invalidation
const queryKey = ['tasks', { teamId, sprint }]

// Invalidate specific team's tasks
queryClient.invalidateQueries({ queryKey: ['tasks', { teamId: 'team-1' }] })

// ❌ Avoid: Too broad
const queryKey = ['data']  // What is this?
```

## Common Mistakes

### Mistake 1: Query Function Includes UI Logic

```typescript
// ❌ Wrong
queryFn: async () => {
  const data = await fetch('/api/tasks')
  // This will re-run when component renders!
  showLoadingToast()
  return data
}

// ✅ Correct
const { isLoading } = useQuery({
  queryKey: ['tasks'],
  queryFn: async () => {
    return await fetch('/api/tasks').then(r => r.json())
  }
})

// Handle loading in component
if (isLoading) showLoadingToast()
```

### Mistake 2: Not Invalidating on Mutation

```typescript
// ❌ Wrong: Mutation succeeds but data doesn't update
const mutation = useMutation({
  mutationFn: updateTask,
  // Missing onSuccess invalidation!
})

// ✅ Correct
const mutation = useMutation({
  mutationFn: updateTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

### Mistake 3: Missing Error Types

```typescript
// ❌ Wrong
useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
// error is unknown type

// ✅ Correct
useQuery<Task[], Error>({
  queryKey: ['tasks'],
  queryFn: fetchTasks
})
// error is Error type
```

## References

- [useQuery Documentation](https://tanstack.com/query/latest/docs/react/reference/useQuery)
- [useMutation Documentation](https://tanstack.com/query/latest/docs/react/reference/useMutation)
- [Query Key Factory Pattern](https://tanstack.com/query/latest/docs/react/community/lukemorrissey-query-key-factory)
- [Caching Examples](https://tanstack.com/query/latest/docs/react/caching)
