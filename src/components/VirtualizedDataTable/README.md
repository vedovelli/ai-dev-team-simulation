# VirtualizedDataTable

A high-performance, feature-rich data table component built with TanStack Table and React Virtual. Designed to efficiently handle large datasets (1000+ rows) with smooth scrolling and full support for sorting, filtering, column visibility toggles, and keyboard navigation.

## Features

- **Virtual Scrolling**: Renders only visible rows for optimal performance with 1000+ rows
- **Column Sorting**: Click column headers to sort ascending/descending
- **Global Filtering**: Search across all columns in real-time
- **Column Visibility Toggles**: Show/hide columns with button controls
- **Keyboard Navigation**: Arrow keys, Home, and End for accessibility
- **WCAG AA Compliance**: Full accessibility with semantic HTML and ARIA attributes
- **Responsive**: Mobile-friendly design with overflow handling
- **Composable**: Generic TypeScript support for any data structure

## Installation

The component requires the following peer dependencies:
- `@tanstack/react-table`: ^8.0.0
- `@tanstack/react-virtual`: ^3.0.0
- `react`: ^18.0.0

```bash
npm install @tanstack/react-table @tanstack/react-virtual react
```

## Basic Usage

```tsx
import { VirtualizedDataTable } from '@/components/VirtualizedDataTable'
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

export function TasksTable({ tasks }: { tasks: Task[] }) {
  return (
    <VirtualizedDataTable
      data={tasks}
      columns={columns}
      emptyMessage="No tasks available"
    />
  )
}
```

## Advanced Usage with State Management

```tsx
import { useVirtualizedTableState, VirtualizedDataTable } from '@/components/VirtualizedDataTable'
import { useState } from 'react'

export function AdvancedTasksTable({ tasks }: { tasks: Task[] }) {
  const tableState = useVirtualizedTableState({
    initialColumnVisibility: {
      id: true,
      title: true,
      status: true,
    },
  })

  const [isLoading, setIsLoading] = useState(false)

  return (
    <VirtualizedDataTable
      data={tasks}
      columns={columns}
      isLoading={isLoading}
      globalFilter={tableState.globalFilter}
      onGlobalFilterChange={tableState.setGlobalFilter}
      columnVisibility={tableState.columnVisibility}
      onColumnVisibilityChange={tableState.setColumnVisibility}
      enableSorting={true}
      enableFiltering={true}
      keyboardNavigation={true}
    />
  )
}
```

## Props

### VirtualizedDataTable

```typescript
interface VirtualizedDataTableProps<T extends Record<string, unknown>> {
  // Required
  data: T[]
  columns: ColumnDef<T>[]

  // Optional: Loading & Error States
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyMessage?: string

  // Optional: Filtering
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  enableFiltering?: boolean

  // Optional: Sorting
  enableSorting?: boolean

  // Optional: Column Visibility
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void

  // Optional: Keyboard Navigation
  keyboardNavigation?: boolean

  // Optional: Virtualization
  estimateSize?: number // Default: 50 (row height in px)
  overscan?: number     // Default: 10 (extra rows to render)

  // Optional: Styling
  rowClassName?: (row: T, index: number) => string
}
```

### useVirtualizedTableState

```typescript
function useVirtualizedTableState(options?: {
  initialColumnVisibility?: Record<string, boolean>
}): {
  globalFilter: string
  columnVisibility: Record<string, boolean>
  selectedRowIndex: number | null
  setGlobalFilter: (value: string) => void
  setColumnVisibility: (visibility: Record<string, boolean>) => void
  setSelectedRowIndex: (index: number | null) => void
  resetState: () => void
}
```

## Column Definition

Define columns using TanStack Table's `ColumnDef`:

```tsx
const columns: ColumnDef<Task>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>
        ID {column.getIsSorted() === 'asc' && '↑'}
        {column.getIsSorted() === 'desc' && '↓'}
      </button>
    ),
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue<'pending' | 'complete'>()
      return (
        <span className={status === 'complete' ? 'text-green-600' : 'text-yellow-600'}>
          {status}
        </span>
      )
    },
  },
]
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between rows |
| `Home` | Jump to first row |
| `End` | Jump to last row |

## Accessibility

The component implements WCAG AA compliance:

- **Semantic HTML**: Uses `<table>` with proper `<thead>` and `<tbody>`
- **ARIA Roles**: Includes `role="grid"`, `role="row"`, `role="columnheader"`, `role="gridcell"`
- **ARIA Attributes**:
  - `aria-rowcount`: Total number of rows
  - `aria-rowindex`: Current row number
  - `aria-sort`: Column sort direction (ascending/descending)
  - `aria-label`: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support with focus management
- **Focus Indicators**: Visual focus states for keyboard users
- **Error Alerts**: `role="alert"` for error messages

## Performance Tips

1. **Estimate Size**: Set accurate `estimateSize` for your row height to improve scroll performance
2. **Overscan**: Adjust `overscan` based on scroll speed (higher values = smoother but more render)
3. **useMemo**: Wrap data and columns in `useMemo` to prevent unnecessary re-renders

```tsx
const columns = useMemo(() => [...], [])
const data = useMemo(() => [...], [dependency])

return <VirtualizedDataTable data={data} columns={columns} />
```

4. **Filter Server-Side**: For datasets > 10,000 rows, implement server-side filtering

## Examples

### With Sorting

```tsx
const columns: ColumnDef<Task>[] = [
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
]
```

### With Custom Cell Rendering

```tsx
const columns: ColumnDef<Task>[] = [
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue<string>()
      return (
        <span className={`px-2 py-1 rounded ${
          status === 'done' ? 'bg-green-100 text-green-800' :
          status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
  },
]
```

### With Row Selection

```tsx
const tableState = useVirtualizedTableState()

return (
  <VirtualizedDataTable
    data={tasks}
    columns={columns}
    // ... other props
    rowClassName={(row, index) =>
      tableState.selectedRowIndex === index ? 'bg-blue-100' : ''
    }
  />
)
```

## MSW Mock Setup

For testing or development, use the provided MSW endpoint:

```
GET /api/virtualized-tasks
```

Query parameters:
- `pageIndex`: 0-based page number (default: 0)
- `pageSize`: Rows per page (default: 100)
- `sortBy`: Column ID to sort by (default: 'id')
- `sortOrder`: 'asc' or 'desc' (default: 'asc')
- `search`: Global search term
- `status`, `priority`, `team`, `assignee`: Filter parameters

Example:
```typescript
const response = await fetch(
  '/api/virtualized-tasks?pageIndex=0&pageSize=50&sortBy=title&sortOrder=asc&search=task'
)
const { data, total } = await response.json()
```

## Testing

The component includes comprehensive unit tests using Vitest and React Testing Library.

Run tests:
```bash
npm run test
```

Test coverage includes:
- Rendering and data display
- Loading and error states
- Sorting functionality
- Global filtering
- Column visibility toggling
- Keyboard navigation
- Accessibility attributes
- Row count display

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile Latest

## Known Limitations

1. **Fixed Height Container**: The table uses a fixed height (500px default) for virtualization
2. **Estimated Row Height**: Row height must be estimated; exact heights improve performance
3. **Column Resizing**: Not supported in current version
4. **Row Selection Checkbox**: Not included; implement custom cell renderer if needed
5. **Expanding Rows**: Not supported; use modal or detail view instead

## Future Improvements

- [ ] Configurable table height
- [ ] Column resizing
- [ ] Row selection with bulk actions
- [ ] Server-side pagination integration
- [ ] Export to CSV/Excel
- [ ] Column reordering (drag & drop)
- [ ] Sticky column headers for horizontal scroll

## License

ISC
