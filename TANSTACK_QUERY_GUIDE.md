# Advanced Data Fetching with TanStack Query + MSW Fixtures

This guide documents the patterns and best practices implemented in this project for data fetching using TanStack Query (React Query) with MSW (Mock Service Worker) fixtures.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Query Configuration](#query-configuration)
3. [Query Key Factory Pattern](#query-key-factory-pattern)
4. [Advanced Hooks](#advanced-hooks)
   - [Pagination Patterns](#pagination-patterns)
5. [Example Implementations](#example-implementations)
6. [MSW Handlers](#msw-handlers)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Architecture Overview

The data fetching layer is built on these pillars:

- **TanStack Query**: Manages server state, caching, and synchronization
- **Query Key Factory**: Ensures consistent cache invalidation
- **Custom Hooks**: Encapsulate data fetching logic with TypeScript support
- **MSW**: Provides realistic mock API responses for development and testing
- **Error Boundaries**: Handle errors gracefully with user-friendly messages

## Query Configuration

### Global Settings

TanStack Query is configured in `src/main.tsx` with optimized defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes (cache time)
      retry: 1,                         // Retry failed requests once
      refetchOnWindowFocus: false,      // Don't refetch on window focus
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### Key Configuration Options

- **staleTime**: How long data is considered fresh (no refetch needed)
- **gcTime**: How long to keep cached data in memory (formerly `cacheTime`)
- **retry**: Number of retry attempts for failed queries
- **refetchOnWindowFocus**: Whether to refetch when window regains focus

## Query Key Factory Pattern

### Why Query Keys Matter

Query keys are used to:
- Identify and cache query results
- Invalidate related caches when data changes
- Create hierarchical cache structures

### Using Query Keys

Located in `src/lib/queryKeys.ts`:

```typescript
import { queryKeys } from '@/lib/queryKeys'

// List queries
const queryKey = queryKeys.tasks.list()                    // ['tasks', 'list', ...]
const queryKey = queryKeys.tasks.list({ status: 'done' }) // with filters

// Detail queries
const queryKey = queryKeys.tasks.detail('task-123')        // ['tasks', 'detail', 'task-123']

// User queries follow same pattern
const queryKey = queryKeys.users.list()
const queryKey = queryKeys.users.detail('user-42')
```

### Cache Invalidation

Invalidate specific caches after mutations:

```typescript
// Invalidate all tasks-related caches
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })

// Invalidate only task lists
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })

// Invalidate specific task
queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail('task-123') })
```

## Advanced Hooks

### useAdvancedQuery

Enhanced query hook with callbacks and error handling.

**Location**: `src/hooks/useAdvancedQuery.ts`

```typescript
const { data, isLoading, error, refetch } = useAdvancedQuery({
  queryKey: queryKeys.tasks.list(),
  queryFn: () => fetchTasks(),
  onSuccess: (data) => console.log('Loaded', data.length, 'tasks'),
  onError: (error) => console.error('Failed:', error.message),
})
```

**Features**:
- Full TypeScript support with generics
- Automatic callback execution
- Custom error handling
- Additional `isIdle` status

### useDetailQuery

Specialized hook for fetching single items.

```typescript
const { data: task } = useDetailQuery({
  queryKey: queryKeys.tasks.detail('task-123'),
  queryFn: () => fetchTask('task-123'),
  enabled: !!taskId, // Only fetch if taskId exists
})
```

### useAdvancedMutation

Mutation hook with automatic cache invalidation.

**Location**: `src/hooks/useAdvancedMutation.ts`

```typescript
const { mutate, isPending, error } = useAdvancedMutation({
  mutationFn: (data) => updateTaskAPI(taskId, data),
  onSuccess: (updatedTask) => console.log('Updated:', updatedTask),
  onError: (error) => console.error('Update failed:', error),
  invalidateQueries: queryKeys.tasks.all, // Auto-invalidate cache
})

// Call the mutation
mutate({ title: 'New title', status: 'done' })
```

### useUpdateMutation, useCreateMutation, useDeleteMutation

Specialized mutations for CRUD operations:

```typescript
// Create
const { mutate: createTask } = useCreateMutation({
  mutationFn: (data) => createTaskAPI(data),
  invalidateQueries: queryKeys.tasks.all,
})

// Update
const { mutate: updateTask } = useUpdateMutation({
  mutationFn: (data) => updateTaskAPI(taskId, data),
  invalidateQueries: queryKeys.tasks.all,
})

// Delete
const { mutate: deleteTask } = useDeleteMutation({
  mutationFn: () => deleteTaskAPI(taskId),
  invalidateQueries: queryKeys.tasks.all,
})
```

### Pagination Patterns

This project provides two pagination hooks for different use cases:

#### Offset/Limit Pagination
Best for traditional paginated interfaces with page numbers (e.g., products page 1-10).
Simpler to implement but potentially less efficient with large datasets.
Use `usePaginatedQuery` hook.

#### Cursor-Based Pagination
Best for infinite scroll interfaces and feed-like experiences.
More efficient as the server only needs to return data after a cursor position.
Use `useInfiniteScroll` hook.

### usePaginatedQuery

Handles offset/limit pagination with convenient navigation methods.

**Location**: `src/hooks/usePaginatedQuery.ts`

**Usage**:
```typescript
const {
  data,
  page,
  pageSize,
  totalPages,
  total,
  nextPage,
  previousPage,
  goToPage,
  setPageSize,
  canNextPage,
  canPreviousPage,
  isPending,
  isError,
  error,
} = usePaginatedQuery({
  queryKey: ['users'],
  queryFn: (params) => fetchUsers(params),
  initialPageSize: 20,
})
```

**Features**:
- Offset/limit pagination pattern
- State management for page and page size
- Navigation helpers (`nextPage`, `previousPage`, `goToPage`)
- Boundary checks (`canNextPage`, `canPreviousPage`)
- Full error and loading state handling
- Automatic cache management per page

**Integration with TanStack Table**:
```typescript
const { data, page, pageSize, totalPages, setPageSize, goToPage } = usePaginatedQuery(...)

const table = useReactTable({
  data,
  columns,
  state: { pagination: { pageIndex: page - 1, pageSize } },
  onPaginationChange: (updater) => {
    const newState = typeof updater === 'function'
      ? updater({ pageIndex: page - 1, pageSize })
      : updater
    setPageSize(newState.pageSize)
    goToPage(newState.pageIndex + 1)
  },
  pageCount: totalPages,
})
```

### useInfiniteScroll

Handles cursor-based infinite pagination for feed-like interfaces.

**Location**: `src/hooks/useInfiniteScroll.ts`

**Usage**:
```typescript
const {
  data,
  hasNextPage,
  isFetchingNextPage,
  isPending,
  isError,
  error,
  fetchNextPage,
  refetch,
  isRefetching,
} = useInfiniteScroll({
  queryKey: ['feed'],
  queryFn: (cursor) => fetchFeedItems(cursor),
  pageSize: 20,
})
```

**Features**:
- Cursor-based pagination for better performance
- Automatic page concatenation
- Loading states for initial and subsequent pages
- Error handling per page
- Refetch capability

**Integration with React Virtual** (for performance):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteScroll(...)

const virtualizer = useVirtualizer({
  count: hasNextPage ? data.length + 1 : data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 10,
})

// Load more when scrolling near bottom
useEffect(() => {
  const [lastItem] = virtualizer.getVirtualItems().slice(-1)
  if (!lastItem) return
  if (lastItem.index >= data.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}, [virtualizer.getVirtualItems(), data.length, hasNextPage, isFetchingNextPage, fetchNextPage])
```

## Example Implementations

### Basic Query Example

See `src/examples/QueryExample.tsx` for a simple query implementation.

### Advanced Examples

See `src/examples/AdvancedDataFetchingExample.tsx` for:

- **AdvancedQueryExample**: List with filtering and loading states
- **AdvancedMutationExample**: Form with update and delete operations
- **AdvancedDataFetchingExample**: Combined example with both queries and mutations

## MSW Handlers

### Handler Structure

Located in `src/mocks/advancedTaskHandlers.ts`:

```typescript
export const advancedTaskHandlers = [
  // GET - fetch all tasks
  http.get('/api/tasks', async ({ request }) => { ... }),

  // GET - fetch single task
  http.get('/api/tasks/:id', async ({ params }) => { ... }),

  // POST - create task
  http.post('/api/tasks', async ({ request }) => { ... }),

  // PATCH - update task
  http.patch('/api/tasks/:id', async ({ params, request }) => { ... }),

  // DELETE - delete task
  http.delete('/api/tasks/:id', async ({ params }) => { ... }),
]
```

### Handler Features

- **Realistic Delays**: Simulates network latency (200-400ms)
- **Validation**: Checks required fields and data formats
- **Error Cases**: Returns appropriate HTTP status codes
- **Edge Cases**: Handles conflicts, not found, server errors
- **In-memory Store**: Persists changes during development

### Adding Handlers to Worker

Update `src/mocks/browser.ts`:

```typescript
import { advancedTaskHandlers } from './advancedTaskHandlers'

export const worker = setupWorker(
  ...routeHandlers,
  ...handlers,
  ...advancedTaskHandlers, // Add here
)
```

### Testing Error Scenarios

Mock specific error scenarios:

```typescript
// Network error
const response = await fetch('/api/tasks/network-error')

// Server error
const body = { title: 'ERROR', ... }
const response = await fetch('/api/tasks', { method: 'POST', body })

// Validation error
const body = { /* missing required fields */ }
const response = await fetch('/api/tasks', { method: 'POST', body })
```

## Error Handling

### Error Boundary Component

Located in `src/components/ErrorBoundary.tsx`:

```typescript
import { ErrorBoundary, QueryErrorBoundary } from '@/components/ErrorBoundary'

// Catch runtime errors
<ErrorBoundary fallback={(error, retry) => (
  <div>
    <p>Error: {error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
)}>
  <MyComponent />
</ErrorBoundary>

// Handle query errors
<QueryErrorBoundary
  isLoading={isLoading}
  error={error}
  onRetry={() => refetch()}
>
  {data && <TaskList tasks={data} />}
</QueryErrorBoundary>
```

### Error Display Components

```typescript
import {
  MutationError,
  LoadingSpinner,
  EmptyState,
} from '@/components/ErrorBoundary'

// Show mutation errors
<MutationError
  error={mutationError}
  onDismiss={() => setError(null)}
/>

// Loading indicator
<LoadingSpinner message="Loading tasks..." size="md" />

// Empty state
<EmptyState
  title="No tasks"
  message="Create your first task to get started"
  action={{ label: 'Create Task', onClick: onCreate }}
/>
```

## Best Practices

### 1. Always Use Query Key Factory

```typescript
// ✅ Good - Consistent, easy to invalidate
const queryKey = queryKeys.tasks.list({ status: 'done' })

// ❌ Bad - Hard to manage, inconsistent
const queryKey = ['tasks', { status: 'done' }]
```

### 2. Leverage TypeScript Generics

```typescript
// ✅ Good - Full type safety
const { data } = useAdvancedQuery<Task[]>({
  queryKey: queryKeys.tasks.list(),
  queryFn: fetchTasks,
})

// ❌ Bad - No type information
const { data } = useQuery({
  queryKey: queryKeys.tasks.list(),
  queryFn: fetchTasks,
})
```

### 3. Handle Loading and Error States

```typescript
// ✅ Good
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorDisplay error={error} />
return <TaskList tasks={data} />

// ❌ Bad - No loading or error handling
return <TaskList tasks={data} />
```

### 4. Use Callbacks for Side Effects

```typescript
// ✅ Good - Encapsulated in hook
const { mutate } = useUpdateMutation({
  mutationFn: updateTask,
  onSuccess: (data) => {
    console.log('Updated:', data)
    // Side effects here
  },
})

// ❌ Bad - Side effects in component
const { mutate } = useMutation(updateTask)
// Side effects scattered in component
```

### 5. Optimize with Conditional Queries

```typescript
// ✅ Good - Only fetch when ready
const { data } = useDetailQuery({
  queryKey: queryKeys.tasks.detail(id),
  queryFn: () => fetchTask(id),
  enabled: !!id, // Don't fetch if id is null
})

// ❌ Bad - Unnecessary fetches
const { data } = useDetailQuery({
  queryKey: queryKeys.tasks.detail(id),
  queryFn: () => fetchTask(id), // Fetches even with null id
})
```

### 6. Structure Response Data

```typescript
// API Response format
{
  data: Task[],           // Actual data
  pagination: {           // Optional pagination info
    total: number,
    page: number,
    perPage: number,
  },
  error?: {               // Optional error info
    message: string,
    code: string,
  }
}
```

### 7. Use MSW for Development and Testing

```typescript
// Development: realistic mock responses
npm run dev

// Testing: control responses via handlers
// Update advancedTaskHandlers.ts for test scenarios
```

## Common Patterns

### Pagination

```typescript
const [page, setPage] = useState(1)

const { data } = useAdvancedQuery({
  queryKey: queryKeys.tasks.list({ page }),
  queryFn: () => fetchTasks({ page }),
})
```

### Search/Filter

```typescript
const [search, setSearch] = useState('')

const { data } = useAdvancedQuery({
  queryKey: queryKeys.tasks.list({ search }),
  queryFn: () => fetchTasks({ search }),
  staleTime: 1000 * 60, // Fresh for 1 minute
})
```

### Dependent Queries

```typescript
const { data: user } = useDetailQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
})

const { data: tasks } = useListQuery({
  queryKey: queryKeys.tasks.list({ assignee: userId }),
  queryFn: () => fetchTasks({ assignee: userId }),
  enabled: !!user, // Only fetch after user is loaded
})
```

### Optimistic Updates

```typescript
const queryClient = useQueryClient()

const { mutate } = useUpdateMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all })

    // Snapshot previous data
    const previous = queryClient.getQueryData(queryKeys.tasks.detail(id))

    // Update cache optimistically
    queryClient.setQueryData(queryKeys.tasks.detail(id), newTask)

    return { previous }
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.tasks.detail(id), context.previous)
  },
})
```

## Creating Custom Query Hooks

### Pattern: List Data with Pagination

The `useListItemsQuery` hook demonstrates the recommended pattern for paginated list queries.

**Location**: `src/hooks/queries/useListItemsQuery.ts`

```typescript
// Basic usage
const { items, isLoading, error, pagination, refetch } = useListItemsQuery({
  page: 1,
  pageSize: 10,
})

// Access pagination info
const { currentPage, pageSize, total, totalPages } = pagination

// Refetch on demand
<button onClick={() => refetch()}>Refresh</button>
```

### Adding Items with Optimistic Updates

The `useAddListItem` mutation provides instant feedback with automatic cache invalidation.

```typescript
const { mutate: addItem, isPending } = useAddListItem()

const handleAdd = () => {
  addItem(
    { title: 'New Item', description: 'Description' },
    {
      onSuccess: () => {
        // Item added successfully
        console.log('Item added')
      },
      onError: (error) => {
        // Handle error
        console.error('Failed to add item:', error)
      },
    }
  )
}
```

### Removing Items with Optimistic Updates

The `useRemoveListItem` mutation removes items with proper error handling and cache invalidation.

```typescript
const { mutate: removeItem, isPending } = useRemoveListItem()

const handleDelete = (id: string) => {
  removeItem(
    { id },
    {
      onSuccess: () => {
        console.log('Item deleted')
      },
    }
  )
}
```

### Building List Components

The `ListView` component shows a complete implementation with:

- **Data Fetching**: Uses `useListItemsQuery` for paginated data
- **Item Management**: Integrates `useAddListItem` and `useRemoveListItem`
- **User Feedback**: Loading states, error handling, empty states
- **Pagination Controls**: Next/previous buttons with page info
- **Form Handling**: Add item form with validation

**Location**: `src/components/List/ListView.tsx`

```typescript
import { ListView } from '@/components/List/ListView'

export function Page() {
  return <ListView pageSize={10} />
}
```

### Individual Item Display

The `ListItem` component renders a single list item with delete action.

**Location**: `src/components/List/ListItem.tsx`

```typescript
<ListItem
  item={item}
  onDelete={handleDelete}
  isDeleting={false}
/>
```

## Error Handling Patterns

### Query Errors

Handle errors from failed data fetches:

```typescript
const { data, error, refetch } = useListItemsQuery()

if (error) {
  return (
    <div className="error-message">
      <p>Error: {(error as Error).message}</p>
      <button onClick={() => refetch()}>Retry</button>
    </div>
  )
}
```

### Mutation Errors

Handle errors from add/remove operations:

```typescript
const { mutate, error } = useAddListItem()

const handleAdd = () => {
  mutate(data, {
    onError: (error) => {
      console.error('Failed to add item:', (error as Error).message)
      // Show error toast to user
    },
  })
}
```

## Optimistic Update Strategies

### List Mutations

When adding or removing items, the cache is automatically invalidated:

```typescript
// Adding an item
const { mutate: addItem } = useAddListItem()
addItem(newItem) // Automatically refetches list after success

// Removing an item
const { mutate: removeItem } = useRemoveListItem()
removeItem({ id }) // Automatically refetches list after success
```

### Manual Optimistic Updates

For more control, use `useQueryClient` directly:

```typescript
const queryClient = useQueryClient()

const { mutate } = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: itemKeys.all })

    // Snapshot previous data
    const previous = queryClient.getQueryData(itemKeys.list())

    // Optimistically update
    queryClient.setQueryData(itemKeys.list(), (old) => ({
      ...old,
      data: old.data.map(item =>
        item.id === newItem.id ? newItem : item
      ),
    }))

    return { previous }
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(itemKeys.list(), context?.previous)
  },
})
```

## Cache Invalidation Best Practices

### After Successful Mutations

All mutations automatically invalidate relevant caches:

```typescript
// Adding invalidates all list queries
useAddListItem() // triggers: queryClient.invalidateQueries({ queryKey: itemKeys.lists() })

// Removing invalidates all list queries
useRemoveListItem() // triggers: queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
```

### Manual Invalidation

For custom scenarios:

```typescript
const queryClient = useQueryClient()

// Invalidate all item caches
queryClient.invalidateQueries({ queryKey: itemKeys.all })

// Invalidate only list queries
queryClient.invalidateQueries({ queryKey: itemKeys.lists() })

// Invalidate specific list with filters
queryClient.invalidateQueries({
  queryKey: itemKeys.list({ page: 1, pageSize: 10 })
})
```

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [MSW Documentation](https://mswjs.io/)
- [React Query Best Practices](https://tkdodo.eu/blog/react-query-as-a-state-manager)

## Questions?

Refer to the example files or the inline documentation in each hook and component.
