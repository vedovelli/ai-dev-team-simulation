# TanStack Table Developer Guide

## Introduction

TanStack Table (React Table) is a headless UI library for building powerful tables. It handles state management for sorting, filtering, selection, and pagination while leaving rendering to you.

## Building a New Table

### Basic Table Hook

```typescript
import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import type { Task } from '../types/task'

interface UseTaskTableProps {
  data: Task[]
  sorting: SortingState
  setSorting: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  setColumnFilters: (filters: ColumnFiltersState) => void
}

/**
 * Create a table instance for tasks with sorting and filtering
 *
 * @example
 * const [sorting, setSorting] = useState<SortingState>([])
 * const [filters, setFilters] = useState<ColumnFiltersState>([])
 * const { table, columns } = useTaskTable({
 *   data: tasks,
 *   sorting,
 *   setSorting,
 *   columnFilters: filters,
 *   setColumnFilters: setFilters,
 * })
 */
export function useTaskTable({
  data,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
}: UseTaskTableProps) {
  const table = useReactTable({
    data,
    columns: taskColumns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return { table, columns: taskColumns }
}
```

## Column Definition Patterns

### Basic Column

```typescript
const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: (info) => info.getValue(),
  },
]
```

### Column with Custom Header

```typescript
{
  accessorKey: 'status',
  header: ({ column }) => (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="cursor-pointer"
    >
      Status
      {column.getIsSorted() === 'asc' && ' ↑'}
      {column.getIsSorted() === 'desc' && ' ↓'}
    </button>
  ),
  cell: (info) => {
    const status = info.getValue() as string
    return <span className={`badge badge-${status}`}>{status}</span>
  },
}
```

### Column with Formatted Cell

```typescript
{
  accessorKey: 'storyPoints',
  header: 'Points',
  cell: (info) => {
    const points = info.getValue() as number
    return (
      <span className={points > 5 ? 'text-red-500' : 'text-green-500'}>
        {points}
      </span>
    )
  },
}
```

### Column with Status Badge

```typescript
{
  accessorKey: 'status',
  header: 'Status',
  cell: (info) => {
    const status = info.getValue() as TaskStatus
    const statusLabels: Record<TaskStatus, string> = {
      backlog: 'Backlog',
      'in-progress': 'In Progress',
      'in-review': 'In Review',
      done: 'Done',
    }
    const statusColors: Record<TaskStatus, string> = {
      backlog: 'bg-gray-100',
      'in-progress': 'bg-blue-100',
      'in-review': 'bg-yellow-100',
      done: 'bg-green-100',
    }
    return (
      <span className={`px-2 py-1 rounded ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
    )
  },
}
```

### Column with Nested Accessor

```typescript
{
  accessorKey: 'assignee.name',  // Nested property
  header: 'Assigned To',
  cell: (info) => info.getValue(),
}
```

### Column with Accessor Function

```typescript
{
  accessorFn: (row) => `${row.firstName} ${row.lastName}`,
  header: 'Full Name',
  cell: (info) => info.getValue(),
}
```

### Column with Action Buttons

```typescript
{
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => {
    const task = row.original
    return (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(task.id)}>Edit</button>
        <button onClick={() => handleDelete(task.id)}>Delete</button>
      </div>
    )
  },
}
```

### Column with Checkbox (for Selection)

```typescript
{
  id: 'select',
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllRowsSelected()}
      onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={(e) => row.toggleSelected(e.target.checked)}
    />
  ),
}
```

## Table Rendering

### Basic Table Structure

```typescript
export function TaskTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const { data: tasks } = useTasks()
  const { table } = useTaskTable({
    data: tasks || [],
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
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

### Table with Column Filters

```typescript
export function TaskTableWithFilters() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const { data: tasks } = useTasks()
  const { table } = useTaskTable({
    data: tasks || [],
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  })

  const statusColumn = table.getColumn('status')
  const priorityColumn = table.getColumn('priority')

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <select
          value={
            (statusColumn?.getFilterValue() as string) || ''
          }
          onChange={(e) => statusColumn?.setFilterValue(e.target.value || undefined)}
        >
          <option value="">All Statuses</option>
          <option value="backlog">Backlog</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={
            (priorityColumn?.getFilterValue() as string) || ''
          }
          onChange={(e) => priorityColumn?.setFilterValue(e.target.value || undefined)}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Table */}
      <table>
        {/* ... */}
      </table>
    </>
  )
}
```

## Advanced Features

### Sorting

```typescript
// Access sorting state
const sortingState = table.getState().sorting

// Sort multiple columns
table.setSorting([
  { id: 'status', desc: false },
  { id: 'priority', desc: true },
])

// Toggle sort on column
const column = table.getColumn('status')
column?.toggleSorting()  // Toggle asc/desc
column?.toggleSorting(false)  // Sort ascending
```

### Row Selection

```typescript
const selectedRows = table.getSelectedRowModel().rows
const selectedData = selectedRows.map(row => row.original)

// Select all visible rows
table.toggleAllRowsSelected(true)

// Select specific row
const row = table.getRow('rowId')
row.toggleSelected(true)
```

### Pagination

```typescript
import { getPaginationRowModel } from '@tanstack/react-table'

const table = useReactTable({
  // ... other options
  getPaginationRowModel: getPaginationRowModel(),
})

// In component
<div className="flex gap-2 mt-4">
  <button
    onClick={() => table.setPageIndex(0)}
    disabled={!table.getCanPreviousPage()}
  >
    First
  </button>
  <button
    onClick={() => table.previousPage()}
    disabled={!table.getCanPreviousPage()}
  >
    Previous
  </button>

  <span>
    Page {table.getState().pagination.pageIndex + 1} of{' '}
    {table.getPageCount()}
  </span>

  <button
    onClick={() => table.nextPage()}
    disabled={!table.getCanNextPage()}
  >
    Next
  </button>
  <button
    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
    disabled={!table.getCanNextPage()}
  >
    Last
  </button>
</div>

<select
  value={table.getState().pagination.pageSize}
  onChange={(e) => table.setPageSize(Number(e.target.value))}
>
  {[10, 20, 30, 40, 50].map((pageSize) => (
    <option key={pageSize} value={pageSize}>
      Show {pageSize}
    </option>
  ))}
</select>
```

### Expandable Rows

```typescript
const columns: ColumnDef<Task>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => (
      <button onClick={() => row.toggleExpanded()}>
        {row.getIsExpanded() ? '▼' : '▶'}
      </button>
    ),
  },
  // ... other columns
]

const table = useReactTable({
  // ... other options
  getExpandedRowModel: getExpandedRowModel(),
})

// Render expanded content
{table.getRowModel().rows.map((row) => (
  <>
    <tr key={row.id}>
      {/* ... regular cells ... */}
    </tr>
    {row.getIsExpanded() && (
      <tr>
        <td colSpan={columns.length}>
          <div className="p-4">
            {/* Expanded content */}
            <TaskDetails task={row.original} />
          </div>
        </td>
      </tr>
    )}
  </>
))}
```

### Global Search

```typescript
const [globalFilter, setGlobalFilter] = useState('')

const table = useReactTable({
  // ... other options
  state: {
    globalFilter,
    // ...
  },
  onGlobalFilterChange: setGlobalFilter,
  getFilteredRowModel: getFilteredRowModel(),
})

// In component
<input
  type="text"
  placeholder="Search all columns..."
  value={globalFilter ?? ''}
  onChange={(e) => setGlobalFilter(e.target.value)}
  className="mb-4 p-2 border"
/>
```

## Customization Examples

### Custom Row Styling

```typescript
<tr
  key={row.id}
  className={row.getIsSelected() ? 'bg-blue-100' : ''}
  style={{
    backgroundColor: row.original.priority === 'high' ? '#fce4ec' : undefined,
  }}
>
  {/* cells */}
</tr>
```

### Custom Empty State

```typescript
{table.getRowModel().rows.length === 0 ? (
  <tr>
    <td colSpan={columns.length} className="text-center p-4">
      <p className="text-gray-500">No tasks found</p>
    </td>
  </tr>
) : (
  table.getRowModel().rows.map(/* render rows */)
)}
```

### Loading State

```typescript
export function TaskTable({ isLoading }: { isLoading: boolean }) {
  // ... table setup

  if (isLoading) {
    return (
      <table>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td colSpan={columns.length}>
                <div className="h-10 bg-gray-200 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <table>{/* ... */}</table>
}
```

## Best Practices

### 1. Keep Column Definitions Static

```typescript
// ✅ Good: Define outside component or use useMemo
const columns: ColumnDef<Task>[] = [...]

export function TaskTable() {
  const table = useReactTable({
    columns,  // Stable reference
    // ...
  })
}

// ❌ Avoid: Defining in component body
export function TaskTable() {
  const columns: ColumnDef<Task>[] = [...]  // Recreated every render
  const table = useReactTable({
    columns,
    // ...
  })
}
```

### 2. Memoize Table Instance

```typescript
const table = useMemo(
  () =>
    useReactTable({
      data,
      columns,
      state: { sorting, columnFilters },
      // ...
    }),
  [data, columns, sorting, columnFilters]
)
```

### 3. Handle Empty States

```typescript
if (!data || data.length === 0) {
  return <EmptyState message="No tasks found" />
}

return <table>{/* ... */}</table>
```

### 4. Use TypeScript for Column Definitions

```typescript
// ✅ Good: Type-safe column definitions
const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',  // TypeScript validates this exists on Task
    header: 'Title',
  },
]

// ❌ Avoid: Untyped
const columns = [
  {
    accessorKey: 'tile',  // Typo not caught at compile time
    header: 'Title',
  },
]
```

### 5. Separate Table Logic from Rendering

```typescript
// ✅ Good: Custom hook for table logic
export function useTaskTable(data: Task[]) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns: taskColumns,
    state: { sorting },
    onSortingChange: setSorting,
    // ...
  })
  return { table, sorting, setSorting }
}

// Use in component
export function TaskTable() {
  const { data: tasks } = useTasks()
  const { table } = useTaskTable(tasks || [])
  return <table>{/* ... */}</table>
}
```

## Common Patterns

### Pattern 1: Sortable Column Header

```typescript
{
  accessorKey: 'title',
  header: ({ column }) => (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="hover:bg-gray-100 p-2 cursor-pointer"
    >
      Title
      {{
        asc: ' 🔼',
        desc: ' 🔽',
        false: ' ⬍',
      }[String(column.getIsSorted())] ?? null}
    </button>
  ),
}
```

### Pattern 2: Dynamic Column Visibility

```typescript
{
  id: 'visibility',
  cell: ({ table }) => {
    const allColumns = table.getAllColumns()
    return (
      <div className="flex flex-col gap-2">
        {allColumns
          .filter((col) => col.getCanHide())
          .map((col) => (
            <label key={col.id} className="flex gap-2">
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
              />
              {col.columnDef.header}
            </label>
          ))}
      </div>
    )
  },
}
```

### Pattern 3: Server-Side Filtering

```typescript
// Combine server params with client-side sorting
const filters = columnFilters.reduce((acc, filter) => {
  acc[filter.id] = filter.value
  return acc
}, {} as Record<string, any>)

const { data: tasks } = useTasks(filters)
```

## Troubleshooting

### Problem: Column doesn't filter

**Solution:** Ensure `getFilteredRowModel` is included:
```typescript
const table = useReactTable({
  // ...
  getFilteredRowModel: getFilteredRowModel(),
})
```

### Problem: Sorting doesn't work

**Solution:** Ensure `getSortedRowModel` is included:
```typescript
const table = useReactTable({
  // ...
  getSortedRowModel: getSortedRowModel(),
})
```

### Problem: Row selection not updating

**Solution:** Ensure `getRowModel` is after other row models:
```typescript
const table = useReactTable({
  // ...
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getRowModel: getRowModel(),  // Last
})
```

## References

- [useReactTable Documentation](https://tanstack.com/table/latest/docs/api/core/table)
- [Column Definitions](https://tanstack.com/table/latest/docs/guide/column-defs)
- [Row Models](https://tanstack.com/table/latest/docs/guide/row-models)
- [Examples](https://tanstack.com/table/latest/docs/examples)
