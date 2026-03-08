# Router-Driven Table State Hook & URL Integration

Complete guide for implementing URL-driven table state using `useTableRouter` hook with TanStack Router and Query.

## Overview

The `useTableRouter` hook provides a unified pattern for managing search, filtering, sorting, and pagination across all data tables. It bridges TanStack Router's URL parameters with TanStack Query's data fetching, enabling:

- **URL-driven state**: Complete table state persists in URL
- **Shareable URLs**: Copy/paste to share filtered views
- **Browser navigation**: Back/forward buttons work correctly
- **Server-side operations**: Delegated filtering, sorting, pagination
- **Debounced search**: Reduces API calls while typing (300ms default)
- **Type safety**: Fully typed query parameters and response format

## URL Format

The hook uses a standardized URL format:

```
/tasks?search=login&filter[status]=active&filter[priority]=high&sort=-created_at&page=2&limit=20
```

### Query Parameters

| Parameter | Format | Example | Purpose |
|-----------|--------|---------|---------|
| `search` | string | `search=authentication` | Full-text search across all fields |
| `filter[field]` | key=value pairs | `filter[status]=in-progress&filter[priority]=high` | Field-specific filtering (bracket notation) |
| `sort` | field or -field | `sort=createdAt` or `sort=-createdAt` | Sort field; `-` prefix for descending |
| `page` | number | `page=2` | Current page (1-indexed) |
| `limit` | number | `limit=25` | Items per page |

**Notes:**
- Filter fields use bracket notation: `filter[fieldName]=value`
- Multiple filters are combined with AND logic
- Sort prefix `-` indicates descending order; omit or use no prefix for ascending
- Page defaults to 1; only included in URL if > 1
- Limit defaults to 10; only included if non-default

## Basic Usage

### Simple Task List

```tsx
import { useTableRouter } from '@/hooks/useTableRouter'

export function TaskList() {
  const {
    data,
    isLoading,
    meta,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    setSort,
    page,
    setPage,
    limit,
    setLimit,
  } = useTableRouter({
    queryKey: ['tasks'],
    queryFn: async (query) => {
      const params = new URLSearchParams()
      if (query.search) params.append('search', query.search)
      Object.entries(query.filter || {}).forEach(([k, v]) => {
        params.append(`filter[${k}]`, v)
      })
      if (query.sort) params.append('sort', query.sort)
      params.append('page', String(query.page))
      params.append('limit', String(query.limit))

      const res = await fetch(`/api/tasks?${params}`)
      return res.json()
    },
  })

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks..."
      />

      <table>
        <thead>
          <tr>
            <th onClick={() => setSort(sort === 'title' ? '-title' : 'title')}>
              Title {sort === 'title' && '↑'} {sort === '-title' && '↓'}
            </th>
            <th onClick={() => setSort(sort === 'status' ? '-status' : 'status')}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setPage(page - 1)} disabled={page === 1}>
        Previous
      </button>
      <span>
        Page {page} of {Math.ceil(meta.total / limit)}
      </span>
      <button onClick={() => setPage(page + 1)} disabled={!meta.hasMore}>
        Next
      </button>
    </div>
  )
}
```

## Advanced Patterns

### With Status & Priority Filters

```tsx
export function AdvancedTaskFilter() {
  const {
    data,
    search,
    setSearch,
    filters,
    setFilter,
    clearFilters,
    isSortAsc,
    isSortDesc,
  } = useTableRouter({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    defaultLimit: 20,
  })

  return (
    <div>
      {/* Search box */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />

      {/* Status filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => setFilter('status', e.target.value || null)}
      >
        <option value="">All Statuses</option>
        <option value="backlog">Backlog</option>
        <option value="in-progress">In Progress</option>
        <option value="in-review">In Review</option>
        <option value="done">Done</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority || ''}
        onChange={(e) => setFilter('priority', e.target.value || null)}
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* Clear filters button */}
      {Object.keys(filters).length > 0 && (
        <button onClick={clearFilters}>Clear Filters</button>
      )}

      {/* Results */}
      {data.length === 0 && <p>No tasks found</p>}
      {data.map((task) => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>Status: {task.status} | Priority: {task.priority}</p>
        </div>
      ))}
    </div>
  )
}
```

### With TanStack Table Integration

```tsx
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTableRouter } from '@/hooks/useTableRouter'

const columnHelper = createColumnHelper<Task>()

const columns = [
  columnHelper.accessor('title', {
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('status', {
    cell: (info) => info.getValue(),
  }),
]

export function TableWithTanStackTable() {
  const { data, isLoading, sort, setSort } = useTableRouter({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                onClick={() => {
                  const field = header.id
                  setSort(
                    sort === field
                      ? `-${field}`
                      : field
                  )
                }}
                style={{ cursor: 'pointer' }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {sort === field && ' ↑'}
                {sort === `-${field}` && ' ↓'}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Server-Side Implementation

The hook expects API endpoints to accept and handle query parameters:

```typescript
// GET /api/tasks?search=term&filter[status]=active&sort=-createdAt&page=2&limit=20

interface TableResponse<T> {
  data: T[]
  meta: {
    total: number        // Total items matching filters
    page: number         // Current page
    limit: number        // Items per page
    hasMore: boolean     // true if more pages available
  }
}
```

### Example MSW Handler

```typescript
import { http, HttpResponse } from 'msw'

http.get('/api/tasks', async ({ request }) => {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('filter[status]')
  const priority = url.searchParams.get('filter[priority]')
  const sort = url.searchParams.get('sort')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')

  // Apply search
  let results = mockTasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase())
  )

  // Apply filters
  if (status) results = results.filter(t => t.status === status)
  if (priority) results = results.filter(t => t.priority === priority)

  // Apply sort
  if (sort) {
    const isDesc = sort.startsWith('-')
    const field = isDesc ? sort.slice(1) : sort
    results.sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return isDesc ? -comparison : comparison
    })
  }

  // Apply pagination
  const total = results.length
  const start = (page - 1) * limit
  const paginatedData = results.slice(start, start + limit)

  return HttpResponse.json({
    data: paginatedData,
    meta: {
      total,
      page,
      limit,
      hasMore: start + limit < total,
    },
  })
})
```

## API Reference

### useTableRouter Options

```typescript
interface UseTableRouterOptions<TData> {
  // Required
  queryKey: (string | number | undefined)[]
  queryFn: (query: TableRouterQuery) => Promise<{
    data: TData[]
    meta: { total: number; page: number; hasMore: boolean }
  }>

  // Optional
  searchDebounce?: number // Default: 300ms
  defaultLimit?: number   // Default: 10
}
```

### Return Value

```typescript
interface UseTableRouterReturn<TData> {
  // Data
  data: TData[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  meta: { total: number; page: number; hasMore: boolean }

  // Current state
  query: TableRouterQuery
  search: string
  filters: Record<string, string>
  sort: string
  page: number
  limit: number

  // Update handlers
  setSearch: (term: string) => void
  setFilter: (field: string, value: string | null) => void
  setFilters: (filters: Record<string, string | null>) => void
  clearFilters: () => void
  setSort: (field: string | null) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearState: () => void

  // Helpers
  isSortAsc: (field: string) => boolean
  isSortDesc: (field: string) => boolean
}
```

### Utility Functions

#### parseTableQuery

Parses URL query parameters into typed `TableRouterQuery` object:

```typescript
const query = parseTableQuery({
  search: 'login',
  'filter[status]': 'active',
  sort: '-createdAt',
  page: '2',
  limit: '20',
})
// Result:
// {
//   search: 'login',
//   filter: { status: 'active' },
//   sort: '-createdAt',
//   page: 2,
//   limit: 20
// }
```

#### serializeTableQuery

Converts `TableRouterQuery` back to URL parameters:

```typescript
const params = serializeTableQuery({
  search: 'login',
  filter: { status: 'active' },
  sort: '-createdAt',
  page: 2,
  limit: 20,
})
// Result:
// {
//   search: 'login',
//   'filter[status]': 'active',
//   sort: '-createdAt',
//   page: 2,
//   limit: 20
// }
```

## Key Features

### Debounced Search

Search updates are debounced by 300ms (configurable) to prevent excessive API calls while typing:

```tsx
const { setSearch } = useTableRouter({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
  searchDebounce: 500, // Custom debounce
})
```

### Automatic Page Reset

Changing search, filters, or sort automatically resets to page 1 to avoid empty results:

```tsx
setFilter('status', 'done') // Automatically sets page to 1
setSearch('test')           // Automatically sets page to 1
setSort('title')            // Automatically sets page to 1
```

### State Persistence

All state is persisted in URL, making it shareable and browser-back compatible:

```
Before: /tasks
After:  /tasks?search=auth&filter[priority]=high&page=2&limit=20
```

### Efficient Caching

Leverages TanStack Query's caching (30s stale, 5min gc by default):

```tsx
// First call caches data
// Returning to same URL reuses cached data
const { data } = useTableRouter({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
})
```

## Testing

The hook includes comprehensive unit tests for query parsing and serialization:

```bash
npm test -- useTableRouter.test.ts
```

Test coverage includes:
- Single and multiple filter parsing
- Sort field with direction
- Pagination parameter handling
- Round-trip serialization consistency
- Edge cases (invalid values, empty queries)

## Migration Guide

If migrating from `useTableState`:

**Before:**
```tsx
const { setSorting, setColumnFilters, setPage } = useTableState()
```

**After:**
```tsx
const { setSort, setFilter, setPage } = useTableRouter({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
})
```

Key differences:
- Automatic data fetching with `queryFn`
- No manual `useQuery` needed
- Simplified filter API with `setFilter(field, value)`
- Sort uses string format: `'fieldName'` or `'-fieldName'`

## Best Practices

1. **Use unique query keys**: Different tables should have different query keys for independent state
2. **Memoize queryFn**: Prevent function recreation on every render
3. **Validate server params**: Never trust client-provided sort/filter values
4. **Implement pagination limits**: Cap max limit (e.g., 100) on server side
5. **Monitor performance**: Use React DevTools Profiler to detect unnecessary re-renders
6. **Type your data**: Always provide generic type to `useTableRouter<TaskType>()`

## Troubleshooting

### Data not updating when URL changes
- Ensure `queryKey` array matches the actual query
- Check that API returns correct meta object with total/page/hasMore

### Filters not applying
- Verify bracket notation: `filter[fieldName]=value`
- Check server-side filter implementation
- Ensure field names match server schema

### Search not debouncing
- Default is 300ms; adjust `searchDebounce` option if needed
- Ensure you're reading `search` state from hook return, not tracking separately

### Page resets unexpectedly
- Normal behavior when filters/search/sort change
- If unwanted, modify API to handle pagination independently
