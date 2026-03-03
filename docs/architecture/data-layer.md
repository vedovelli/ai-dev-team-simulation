# TanStack Data Layer Architecture

## Overview

This application uses a comprehensive, integrated approach to data management built on the TanStack ecosystem:

- **TanStack Query** - Server state management and data fetching
- **TanStack Table** - Complex table UI with sorting, filtering, and pagination
- **TanStack Form** - Form state management with validation

These libraries work together to provide a complete data flow from server through UI interactions and back to the server.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Backend API                              │
│                    (MSW in Development)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  TanStack Query │
                    │  (Server State) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐
        │TanStack     │ │  Custom   │ │TanStack    │
        │  Table      │ │  Hooks    │ │  Form      │
        │(Consumers)  │ │(Transforms)│ │(Input)     │
        └─────┬──────┘ └─────┬─────┘ └─────┬──────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   React         │
                    │   Components    │
                    │   (UI)          │
                    └─────────────────┘
```

## Data Flow: Query → Table → Form

### 1. Query (Data Fetching)

**Responsibility:** Fetch data from the server and manage caching.

```
useQuery/useMutation → Query Key → Query Function → Cache Management
```

**Example Flow:**
```typescript
// 1. Define query hook with parameters
export function useTasks(params?: TaskQueryParams) {
  const queryKey = ['tasks', params]

  return useQuery<Task[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch('/api/tasks?...')
      return response.json()
    }
  })
}

// 2. Use in component
const { data: tasks, isLoading } = useTasks({ status: 'in-progress' })

// 3. Query cache automatically updates on:
//    - Manual refetch
//    - Cache invalidation after mutations
//    - Stale time expiration
```

**Key Concepts:**
- Query keys are hierarchical arrays: `['tasks', { status: 'done' }]`
- Same query key + same parameters = same cache entry
- Mutations invalidate related query keys to trigger refetches

### 2. Table (Data Display & Manipulation)

**Responsibility:** Display server data with sorting, filtering, and selection.

```
useQuery (data) → useReactTable (columns + state) → Table UI
```

**Example Flow:**
```typescript
// 1. Fetch data with query hook
const { data: tasks } = useTasks()

// 2. Define columns
const columns: ColumnDef<Task>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'status', header: 'Status' },
]

// 3. Create table instance with state management
const [sorting, setSorting] = useState<SortingState>([])
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const table = useReactTable({
  data: tasks || [],
  columns,
  state: { sorting, columnFilters },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})

// 4. Render table using table instance
<table>
  <tbody>
    {table.getRowModel().rows.map(row => (
      <tr key={row.id}>
        {row.getVisibleCells().map(cell => (
          <td key={cell.id}>{cell.renderCell()}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

**Key Concepts:**
- Columns define how data is accessed, formatted, and displayed
- Table state (sorting, filters) is managed separately by the parent component
- Filtering happens in-memory (for UIs with small datasets) or via query parameters

### 3. Form (Data Input & Mutation)

**Responsibility:** Collect user input, validate, and submit changes back to server.

```
useForm (state) → Validation → useMutation → Query Invalidation
```

**Example Flow:**
```typescript
// 1. Create form with TanStack Form
interface TaskFormData {
  title: string
  status: TaskStatus
  priority: TaskPriority
}

const form = useForm<TaskFormData>({
  defaultValues: { title: '', status: 'backlog', priority: 'medium' },
  onSubmit: async ({ value }) => {
    // 2. Validate (done automatically)
    // 3. Call mutation hook
    await updateTask(value)
    // 4. Mutation hook invalidates query cache
    // 5. Query refetches and table updates
  }
})

// 2. Render fields with validation
<form.Field
  name="title"
  validators={{
    onBlur: ({ value }) => value.length < 3 ? 'Too short' : undefined
  }}
>
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.setValue(e.target.value)}
      onBlur={field.handleBlur}
    />
  )}
</form.Field>

// 3. Submit triggers mutation
<button onClick={() => form.handleSubmit()}>Save</button>
```

**Key Concepts:**
- Validation happens at the field level (on blur, on change, etc.)
- Mutations handle the API call and return results
- After successful mutation, related queries are invalidated (triggering refetch)
- Form state and submission errors are managed separately

## Design Decisions

### 1. Why TanStack Stack?

- **Separation of Concerns:** Query = server state, Table = UI state, Form = input state
- **Performance:** Intelligent caching and memoization
- **Type Safety:** Excellent TypeScript support with generics
- **Minimal Abstraction:** Libraries provide primitives, not opinionated components

### 2. No Custom Schema Layer (YAGNI)

We use TanStack libraries directly without wrapping them in a custom abstraction:

**Pros:**
- Reduces code complexity
- Easier to understand (direct library usage)
- Flexible - each form/table can have its own patterns
- No abstraction overhead

**Cons:**
- Some repetition across forms/tables
- Validation logic lives in multiple places

**When to Reconsider:**
- 5+ forms with identical structure
- Need for dynamic form generation
- Complex cross-form synchronization

### 3. Query Key Organization

Query keys follow a hierarchical pattern:

```typescript
// Simple list query
['tasks']

// Parameterized query
['tasks', { status: 'done', team: 'frontend' }]

// Nested resource
['agents', 'agent-123', 'history']

// Entity with filters
['sprints', { id: 'sprint-1', period: '2026-Q1' }]
```

**Benefits:**
- `queryClient.invalidateQueries({ queryKey: ['tasks'] })` invalidates all task queries
- `queryClient.invalidateQueries({ queryKey: ['tasks', { team: 'frontend' }] })` only specific ones
- Granular cache control

### 4. Cache Invalidation Strategy

Two main approaches:

**Mutation-Driven (Recommended for most cases):**
```typescript
const createTaskMutation = useMutation({
  mutationFn: async (data) => await api.createTask(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

**Time-Based (Stale-While-Revalidate):**
```typescript
useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

**Optimistic Updates (for responsive UX):**
```typescript
useMutation({
  mutationFn: updateTask,
  onMutate: (newData) => {
    queryClient.setQueryData(['task', id], newData)
  },
  onError: (error, newData, context) => {
    queryClient.setQueryData(['task', id], context.previousData)
  }
})
```

## Common Patterns

### Pattern 1: Table with Server-Side Filtering

```typescript
// Query hook with filter params
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchWithFilters('/api/tasks', filters)
  })
}

// Component combines server filtering with client-side sorting
const { data: tasks } = useTasks({ status, priority })
const table = useReactTable({
  data: tasks,
  columns,
  state: { sorting },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

### Pattern 2: Form with Optimistic UI

```typescript
const updateMutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    // Optimistically update UI
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old.map(t => t.id === newTask.id ? newTask : t)
    )
  },
  onError: (error, newTask) => {
    // Revert on error
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})
```

### Pattern 3: Dependent Queries

```typescript
// Only fetch agent history after agent ID is available
export function useAgentHistory(agentId: string | null) {
  return useQuery({
    queryKey: ['agents', agentId, 'history'],
    queryFn: () => fetchAgentHistory(agentId),
    enabled: agentId !== null // Don't fetch until agentId is set
  })
}
```

### Pattern 4: Mutation with Form Validation

```typescript
const form = useForm<FormData>({
  onSubmit: async ({ value }) => {
    try {
      // Validate locally first
      const validated = schema.parse(value)
      // Then submit
      await createMutation.mutateAsync(validated)
      // Clear form on success
      form.reset()
    } catch (error) {
      // Handle validation or submission errors
    }
  }
})
```

## Testing with MSW

Mock Service Worker provides a consistent way to mock API responses during development and testing:

```typescript
// handlers.ts
export const handlers = [
  http.get('/api/tasks', () => {
    return HttpResponse.json({ data: mockTasks })
  }),
  http.post('/api/tasks', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({ id: 'new-id', ...data })
  })
]
```

See [MSW Documentation Guide](./msw-documentation.md) for detailed patterns.

## Performance Considerations

### 1. Query Configuration

```typescript
useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
  staleTime: 5 * 60 * 1000,      // Data is fresh for 5 min
  gcTime: 10 * 60 * 1000,         // Keep in memory for 10 min
  refetchOnWindowFocus: false,     // Don't refetch on tab switch
})
```

### 2. Table Performance

For large datasets:
```typescript
// Virtualization for large tables (consider react-window or similar)
// Pagination to limit rendered rows
// Server-side sorting/filtering to reduce data transferred

const table = useReactTable({
  data: tasks,
  columns,
  getPaginationRowModel: getPaginationRowModel(),
})
```

### 3. Form Performance

```typescript
// Debounce async validation
const debouncedValidate = debounce(async (value) => {
  return await validateOnServer(value)
}, 500)

validators={{
  onBlur: debouncedValidate
}}
```

## Migration Guide from Other Approaches

### From REST with useState to Query

**Before:**
```typescript
const [tasks, setTasks] = useState([])
useEffect(() => {
  fetch('/api/tasks').then(r => r.json()).then(setTasks)
}, [])
```

**After:**
```typescript
const { data: tasks } = useTasks()
```

Benefits: Automatic caching, refetch on focus, stale time management, background refetch.

### From Redux to Query

**Before:** Manual action/reducer for every data type

**After:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks
})
```

Benefits: Less boilerplate, built-in async handling, normalized cache.

## Troubleshooting

### Problem: Data not updating after mutation

**Solution:** Ensure mutation invalidates the right query key:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
}
```

### Problem: Form validation not triggering

**Solution:** Check validator configuration and field name:
```typescript
<form.Field
  name="fieldName"  // Must match form data interface
  validators={{
    onBlur: (value) => ...
  }}
>
```

### Problem: Table filters not working

**Solution:** Ensure `getFilteredRowModel` is included:
```typescript
const table = useReactTable({
  ...
  getFilteredRowModel: getFilteredRowModel(),
})
```

## References

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [TanStack Form Docs](https://tanstack.com/form/latest)
- [MSW Docs](https://mswjs.io)
