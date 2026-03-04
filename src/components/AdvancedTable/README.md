# AdvancedTable

A high-performance, enterprise-grade data table component with server-side pagination, sorting, virtual scrolling, and TanStack Query integration for efficient data fetching.

## Features

- **Server-side Pagination**: Page-based navigation with configurable page sizes
- **Server-side Sorting**: Multi-column sort support with sort direction indicators
- **Virtual Scrolling**: Renders only visible rows for optimal performance (1000+ rows)
- **TanStack Query Integration**: Automatic caching and data management
- **Flexible Column Configuration**: Custom cell renderers and column definitions
- **Loading and Error States**: Built-in UI for async operations
- **Responsive Design**: Mobile-friendly with overflow handling
- **Accessibility**: WCAG AA compliance with semantic HTML and ARIA attributes

## Installation

Requires peer dependencies:
- `@tanstack/react-table`: ^8.0.0
- `@tanstack/react-virtual`: ^3.0.0
- `@tanstack/react-query`: ^5.0.0
- `react`: ^19.0.0

## Basic Usage

```tsx
import { AdvancedTable, useAdvancedTableState, useAdvancedTableQuery } from '@/components/AdvancedTable'
import { ColumnDef } from '@tanstack/react-table'

interface Task {
  id: string
  title: string
  status: 'pending' | 'complete'
}

const columns: ColumnDef<Task>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: 'ID',
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: 'Title',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
  },
]

export function TasksTable() {
  const tableState = useAdvancedTableState({
    initialPageSize: 25,
  })

  const { data, isLoading, isError } = useAdvancedTableQuery<Task>(
    '/api/tasks',
    {
      pageIndex: tableState.pageIndex,
      pageSize: tableState.pageSize,
      sorting: tableState.sorting,
    }
  )

  return (
    <AdvancedTable<Task>
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

## Advanced Usage with Filters

```tsx
import { useAdvancedTableQuery, useAdvancedTableState, AdvancedTable } from '@/components/AdvancedTable'
import { useState } from 'react'

export function FilteredTasksTable() {
  const tableState = useAdvancedTableState()
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, isError } = useAdvancedTableQuery(
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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            tableState.setPageIndex(0) // Reset to first page on filter change
          }}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">All</option>
          <option value="backlog">Backlog</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

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
        emptyMessage={statusFilter ? 'No tasks match the selected filter' : 'No tasks available'}
      />
    </div>
  )
}
```

## API Reference

### AdvancedTable Props

```typescript
interface AdvancedTableProps<T extends Record<string, unknown>> {
  // Required
  data: T[]
  columns: ColumnDef<T>[]
  pageIndex: number
  pageSize: number
  total: number
  onPageIndexChange: (index: number) => void
  onPageSizeChange: (size: number) => void
  onSortingChange: (sorting: SortingState) => void
  sorting: SortingState

  // Optional
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyMessage?: string
  enableSorting?: boolean
  pageSizeOptions?: number[]
  estimateSize?: number // Default: 50 (row height in px)
  overscan?: number     // Default: 10
  rowClassName?: (row: T, index: number) => string
}
```

### useAdvancedTableQuery

Server-side data fetching hook with TanStack Query.

```typescript
const { data, isLoading, isError, error, refetch } = useAdvancedTableQuery<Task>(
  '/api/tasks',
  {
    pageIndex: 0,
    pageSize: 25,
    sorting: [],
    filters: { status: 'done' },
    enabled: true,
  }
)
```

**Returns:**
- `data`: `{ data: T[], total: number, pageIndex: number, pageSize: number }`
- `isLoading`: Loading state
- `isError`: Error state
- `error`: Error object if failed
- `refetch`: Manual refetch function

### useAdvancedTableState

State management for pagination and sorting.

```typescript
const {
  pageIndex,
  pageSize,
  sorting,
  setPageIndex,
  setPageSize,
  setSorting,
  resetState,
} = useAdvancedTableState({
  initialPageIndex: 0,
  initialPageSize: 25,
  initialSorting: [],
})
```

## Column Definition

Define columns using TanStack Table's `ColumnDef`:

```tsx
const columns: ColumnDef<Task>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: 'ID',
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>
        Title
        {column.getIsSorted() === 'asc' && ' ↑'}
        {column.getIsSorted() === 'desc' && ' ↓'}
      </button>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue<string>()
      return (
        <span className={status === 'done' ? 'text-green-600' : 'text-yellow-600'}>
          {status}
        </span>
      )
    },
  },
]
```

## Server API Requirements

The endpoint should accept these query parameters and return paginated, sorted data:

**Query Parameters:**
- `pageIndex`: Zero-based page number
- `pageSize`: Rows per page
- `sortBy`: Column ID to sort by
- `sortOrder`: 'asc' or 'desc'
- Additional filter parameters as needed

**Response Format:**
```json
{
  "data": [/* T[] */],
  "total": 1200,
  "pageIndex": 0,
  "pageSize": 25
}
```

## Sorting

The table supports server-side sorting. Click column headers to toggle sort direction. The component automatically sends sort parameters to the server.

## Pagination

- **Page Size Selector**: Configurable page sizes (10, 25, 50, 100 by default)
- **Previous/Next Navigation**: Navigate between pages
- **Page Info**: Displays current page and total pages
- **Row Count**: Shows "Showing X to Y of Z" range

## Virtual Scrolling

The component uses TanStack Virtual for efficient rendering of large datasets:

- Renders only visible rows
- Smooth scrolling with 1000+ rows
- Configurable `estimateSize` (row height) and `overscan` for performance tuning

## Accessibility

- **Semantic HTML**: Proper `<table>` structure
- **ARIA Attributes**: `aria-rowcount`, `aria-rowindex`, `aria-sort`
- **Keyboard Navigation**: Focus management
- **Screen Reader Support**: Descriptive labels and roles

## MSW Mock Setup

Example endpoint configuration for testing:

```typescript
http.get('/api/virtualized-tasks', ({ request }) => {
  const url = new URL(request.url)
  const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
  const pageSize = parseInt(url.searchParams.get('pageSize') || '25', 10)
  const sortBy = url.searchParams.get('sortBy') || 'id'
  const sortOrder = url.searchParams.get('sortOrder') || 'asc'

  // Implement server-side filtering, sorting, and pagination
  // Return: { data: T[], total: number, pageIndex: number, pageSize: number }
})
```

## Performance Tips

1. **Memoize columns and data** to prevent unnecessary re-renders
2. **Adjust row estimate size** based on actual row height
3. **Fine-tune overscan** based on scroll speed (higher = smoother)
4. **Set appropriate stale time** in query options
5. **Implement server-side filtering** for large datasets

```tsx
const columns = useMemo(() => [...], [])
const { data, isLoading } = useAdvancedTableQuery('/api/tasks', {
  pageIndex,
  pageSize,
  sorting,
})

return <AdvancedTable data={data.data} columns={columns} {...props} />
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile Latest

## Examples

### With Custom Cell Rendering

```tsx
const columns: ColumnDef<Task>[] = [
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue<'pending' | 'done'>()
      const classes =
        status === 'done'
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      return <span className={`px-2 py-1 rounded text-sm font-medium ${classes}`}>{status}</span>
    },
  },
]
```

### With Row Highlighting

```tsx
<AdvancedTable
  {...props}
  rowClassName={(row, index) =>
    row.status === 'done' ? 'bg-green-50' : ''
  }
/>
```

## Future Improvements

- [ ] Column resizing and reordering
- [ ] Row selection with bulk actions
- [ ] Export to CSV/Excel
- [ ] Advanced filtering with filter builder
- [ ] Column pinning
- [ ] Row grouping and aggregation
- [ ] Customizable height containers
