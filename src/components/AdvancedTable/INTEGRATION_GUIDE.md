# AdvancedTable Integration Guide

This guide covers integrating the AdvancedTable component into your application with server-side pagination, sorting, and filtering.

## Quick Start

### 1. Basic Setup

```tsx
import { AdvancedTable, useAdvancedTableState, useAdvancedTableQuery } from '@/components/AdvancedTable'
import { ColumnDef } from '@tanstack/react-table'

interface Task {
  id: string
  title: string
  status: string
}

const columns: ColumnDef<Task>[] = [
  { id: 'id', accessorKey: 'id', header: 'ID' },
  { id: 'title', accessorKey: 'title', header: 'Title' },
  { id: 'status', accessorKey: 'status', header: 'Status' },
]

function TasksPage() {
  const tableState = useAdvancedTableState({ initialPageSize: 25 })

  const { data, isLoading, isError } = useAdvancedTableQuery<Task>(
    '/api/virtualized-tasks',
    {
      pageIndex: tableState.pageIndex,
      pageSize: tableState.pageSize,
      sorting: tableState.sorting,
    }
  )

  return (
    <AdvancedTable
      columns={columns}
      data={data.data}
      pageIndex={tableState.pageIndex}
      pageSize={tableState.pageSize}
      total={data.total}
      sorting={tableState.sorting}
      onPageIndexChange={tableState.setPageIndex}
      onPageSizeChange={tableState.setPageSize}
      onSortingChange={tableState.setSorting}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
```

### 2. Server-Side Filtering

```tsx
const [statusFilter, setStatusFilter] = useState('')

const { data, isLoading } = useAdvancedTableQuery(
  '/api/virtualized-tasks',
  {
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    sorting: tableState.sorting,
    filters: {
      status: statusFilter || undefined,
    },
  }
)

// Reset to first page when filter changes
const handleFilterChange = (value: string) => {
  setStatusFilter(value)
  tableState.setPageIndex(0)
}
```

### 3. Column Customization

```tsx
const columns: ColumnDef<Task>[] = [
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue<string>()
      return (
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          status === 'done'
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {status}
        </span>
      )
    },
  },
]
```

## Server Implementation

Your API endpoint must support these query parameters and return paginated data.

### Required Query Parameters

- `pageIndex` (number): Zero-based page number
- `pageSize` (number): Rows per page
- `sortBy` (string): Column ID to sort by (when sorting is applied)
- `sortOrder` (string): 'asc' or 'desc' (when sorting is applied)
- Additional filter parameters as needed

### Expected Response Format

```json
{
  "data": [
    {
      "id": "task-1",
      "title": "Implement feature X",
      "status": "in-progress",
      "priority": "high"
    }
  ],
  "total": 1200,
  "pageIndex": 0,
  "pageSize": 25
}
```

### MSW Handler Example

```typescript
http.get('/api/virtualized-tasks', ({ request }) => {
  const url = new URL(request.url)
  const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
  const pageSize = parseInt(url.searchParams.get('pageSize') || '25', 10)
  const sortBy = url.searchParams.get('sortBy') || 'id'
  const sortOrder = url.searchParams.get('sortOrder') || 'asc'
  const status = url.searchParams.get('status')
  const priority = url.searchParams.get('priority')

  let filteredTasks = [...tasksStore]

  // Apply filters
  if (status) {
    filteredTasks = filteredTasks.filter(t => t.status === status)
  }
  if (priority) {
    filteredTasks = filteredTasks.filter(t => t.priority === priority)
  }

  // Apply sorting
  filteredTasks.sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a]
    const bValue = b[sortBy as keyof typeof b]

    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    }

    return sortOrder === 'desc' ? -comparison : comparison
  })

  // Apply pagination
  const start = pageIndex * pageSize
  const end = start + pageSize
  const paginatedData = filteredTasks.slice(start, end)

  return HttpResponse.json({
    data: paginatedData,
    total: filteredTasks.length,
    pageIndex,
    pageSize,
  })
})
```

### Express.js Example

```typescript
import express from 'express'

app.get('/api/tasks', (req, res) => {
  const pageIndex = parseInt(req.query.pageIndex as string) || 0
  const pageSize = parseInt(req.query.pageSize as string) || 25
  const sortBy = (req.query.sortBy as string) || 'id'
  const sortOrder = (req.query.sortOrder as string) || 'asc'
  const status = req.query.status as string

  // Query database with pagination and sorting
  const query = Task.query()

  if (status) {
    query.where('status', status)
  }

  const total = await query.clone().count().first()
  const data = await query
    .orderBy(sortBy, sortOrder === 'desc' ? 'desc' : 'asc')
    .limit(pageSize)
    .offset(pageIndex * pageSize)

  res.json({
    data,
    total: total?.count || 0,
    pageIndex,
    pageSize,
  })
})
```

## Advanced Features

### Custom Filtering UI

```tsx
function AdvancedFilteredTable() {
  const tableState = useAdvancedTableState()
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    team: '',
  })

  const { data, isLoading } = useAdvancedTableQuery(
    '/api/virtualized-tasks',
    {
      pageIndex: tableState.pageIndex,
      pageSize: tableState.pageSize,
      sorting: tableState.sorting,
      filters: {
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        team: filters.team || undefined,
      },
    }
  )

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    tableState.setPageIndex(0) // Reset to first page
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <FilterSelect
          label="Status"
          options={['backlog', 'in-progress', 'done']}
          value={filters.status}
          onChange={(v) => handleFilterChange('status', v)}
        />
        <FilterSelect
          label="Priority"
          options={['low', 'medium', 'high']}
          value={filters.priority}
          onChange={(v) => handleFilterChange('priority', v)}
        />
        <FilterSelect
          label="Team"
          options={['Frontend', 'Backend', 'DevOps']}
          value={filters.team}
          onChange={(v) => handleFilterChange('team', v)}
        />
      </div>

      <AdvancedTable {...props} data={data.data} />
    </div>
  )
}
```

### Row Actions

```tsx
const columns: ColumnDef<Task>[] = [
  // ... other columns
  {
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const task = info.row.original
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(task)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(task.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      )
    },
  },
]
```

### Row Highlighting

```tsx
<AdvancedTable
  {...props}
  rowClassName={(row) => {
    if (row.priority === 'high') return 'bg-red-50'
    if (row.status === 'done') return 'bg-green-50'
    return ''
  }}
/>
```

## Performance Optimization

### 1. Memoize Columns and Data

```tsx
const columns = useMemo(() => [...], [])

const { data } = useAdvancedTableQuery(
  '/api/tasks',
  {
    pageIndex,
    pageSize,
    sorting,
  }
)
```

### 2. Adjust Virtual Scrolling

```tsx
<AdvancedTable
  estimateSize={60}  // Increase if rows are taller
  overscan={10}      // Increase for smoother scrolling
  pageSizeOptions={[25, 50, 100]}
/>
```

### 3. Optimize Query Caching

```tsx
const { data } = useAdvancedTableQuery(
  '/api/tasks',
  {
    pageIndex,
    pageSize,
    sorting,
  }
  // Query options are configured in the hook
  // Adjust staleTime and gcTime as needed
)
```

### 4. Server-Side Filtering

For large datasets (10,000+ rows), implement server-side filtering instead of client-side filtering.

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdvancedTable } from '@/components/AdvancedTable'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithQuery = (component: React.ReactElement) =>
  render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )

test('renders table with data', () => {
  renderWithQuery(
    <AdvancedTable
      data={mockData}
      columns={columns}
      pageIndex={0}
      pageSize={25}
      total={100}
      sorting={[]}
      onPageIndexChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      onSortingChange={vi.fn()}
    />
  )
  expect(screen.getByText('Task 1')).toBeInTheDocument()
})
```

### Integration Tests

```tsx
test('loads and displays data from API', async () => {
  renderWithQuery(<TasksPage />)

  await waitFor(() => {
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  // Click next page
  fireEvent.click(screen.getByLabelText('Next page'))

  await waitFor(() => {
    expect(screen.getByText('Task 26')).toBeInTheDocument()
  })
})
```

## Accessibility

The AdvancedTable includes full accessibility support:

- **Semantic HTML**: Proper table structure
- **ARIA attributes**: Row counts, sort directions
- **Keyboard navigation**: Navigate between pages
- **Screen reader support**: Descriptive labels

For enhanced accessibility:

```tsx
<AdvancedTable
  columns={columns}
  data={data.data}
  // ... other props
  // Component includes aria-label, aria-rowcount, aria-sort
/>
```

## Troubleshooting

### Data Not Loading

1. Check endpoint URL matches your API
2. Verify response format matches expected schema
3. Check browser Network tab for errors
4. Ensure TanStack Query is properly configured

### Sorting Not Working

1. Verify `sortBy` matches a valid column ID
2. Ensure server-side sorting is implemented
3. Check `enableSorting` prop is `true`

### Pagination Not Updating

1. Ensure `onPageIndexChange` updates state correctly
2. Verify `pageIndex` prop is updated
3. Check that query refetches with new parameters

### Performance Issues

1. Increase `estimateSize` if rows are taller than 50px
2. Reduce `overscan` to render fewer off-screen rows
3. Implement server-side filtering for large datasets
4. Use smaller page sizes for faster initial load

## Examples

### Dashboard Table

See `src/routes/advanced-table.tsx` for a complete example with:
- Server-side pagination
- Multi-column sorting
- Filter UI
- Custom cell rendering
- Row highlighting

### Task Management

```tsx
// See src/components/AdvancedTable/AdvancedTableExample.tsx
// for a complete task management table implementation
```

## Related Components

- **VirtualizedDataTable**: Client-side virtualization without pagination
- **DataTable**: Basic table component without virtual scrolling

## Further Reading

- [TanStack Table Documentation](https://tanstack.com/table)
- [TanStack Virtual Documentation](https://tanstack.com/virtual)
- [TanStack Query Documentation](https://tanstack.com/query)
- [WAI-ARIA Table Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
