# Advanced Data Table Component

A sophisticated, production-ready data table component built with **TanStack Table v8** and **React Virtual** for optimal performance with large datasets.

## Features

### Core Features
- ✅ **Multi-column Sorting** - Click column headers to sort ascending/descending
- ✅ **Row Selection** - Checkboxes for individual and bulk selection
- ✅ **Column Visibility** - Toggle column visibility with Show All/Hide All controls
- ✅ **Global Search** - Search across all visible columns
- ✅ **Virtual Scrolling** - Handles 200+ rows efficiently using react-virtual
- ✅ **Server-side Integration** - Supports pagination, filtering, and sorting via API

### UI/UX Features
- ✅ **Responsive Design** - Works on desktop and tablet
- ✅ **Accessible** - ARIA labels and proper semantic HTML
- ✅ **Loading State** - Spinner animation during data fetch
- ✅ **Error Handling** - Clear error messages and recovery
- ✅ **Empty State** - User-friendly message when no data
- ✅ **Row Selection Feedback** - Visual highlighting and count display

## Components

### `AdvancedDataTable`
Main table component that renders the interactive data grid.

```tsx
import { AdvancedDataTable } from '@/components/DataTable'

function MyTable() {
  const [data, setData] = useState<Employee[]>([])

  return (
    <AdvancedDataTable
      data={data}
      isLoading={false}
      isError={false}
      errorMessage="Failed to load"
      onSortingChange={(sorting) => console.log(sorting)}
    />
  )
}
```

**Props:**
- `data: Employee[]` - Array of employee records
- `isLoading?: boolean` - Show loading spinner
- `isError?: boolean` - Show error state
- `errorMessage?: string` - Custom error message
- `onSortingChange?: (sorting: SortingState) => void` - Callback when user sorts
- `onFiltersChange?: (filters: ColumnFiltersState) => void` - Callback when filters change

### `useTableConfig` Hook
Encapsulates all table state and configuration logic.

```tsx
const {
  columns,              // ColumnDef[] - Configured column definitions
  sorting,             // SortingState - Current sorting state
  setSorting,          // Function to update sorting
  columnFilters,       // ColumnFiltersState - Current filters
  setColumnFilters,    // Function to update filters
  columnVisibility,    // VisibilityState - Which columns are visible
  toggleColumnVisibility, // Toggle single column
  resetColumnVisibility,  // Show all columns
  rowSelection,        // Record<string, boolean> - Selected row IDs
  setRowSelection,     // Function to update selection
  enableColumnVisibility,  // boolean
  enableRowSelection,      // boolean
  enableColumnPinning,     // boolean
} = useTableConfig({
  enableColumnVisibility: true,
  enableRowSelection: true,
  enableColumnPinning: true,
})
```

### `useEmployeeQuery` Hook
Manages employee data fetching with React Query.

```tsx
const { data, isLoading, isError, error } = useEmployeeQuery({
  pageIndex: 0,
  pageSize: 25,
  sorting: [{ id: 'firstName', desc: false }],
  search: 'john',
  department: 'Engineering',
  status: 'active',
})

const employees = data?.data ?? []
const total = data?.total ?? 0
```

### `AdvancedDataTableExample`
Full-featured example component showing integration with filters.

```tsx
import { AdvancedDataTableExample } from '@/components/DataTable'

function Dashboard() {
  return <AdvancedDataTableExample />
}
```

## Column Definitions

The table automatically configures columns for Employee data:

| Column | Type | Sortable | Details |
|--------|------|----------|---------|
| Select | checkbox | No | Bulk selection with select-all |
| First Name | string | Yes | Given name |
| Last Name | string | Yes | Family name |
| Email | string | Yes | Contact email address |
| Department | string | Yes | Organization department |
| Position | string | Yes | Job title |
| Salary | number | Yes | Formatted as currency |
| Status | badge | Yes | active/inactive/on-leave |
| Join Date | date | Yes | Formatted as local date |

## Data Types

### Employee
```typescript
interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  salary: number
  joinDate: string       // ISO 8601
  status: 'active' | 'inactive' | 'on-leave'
  phone?: string
  createdAt: string      // ISO 8601
  updatedAt: string      // ISO 8601
}
```

### API Response
```typescript
interface EmployeesResponse {
  data: Employee[]
  total: number
  pageIndex: number
  pageSize: number
}
```

## MSW Endpoint

The `/api/employees` endpoint supports:

**Query Parameters:**
- `search` - Filter by name, email, or position
- `department` - Filter by department
- `status` - Filter by status (active/inactive/on-leave)
- `sortBy` - Field to sort by (default: firstName)
- `sortOrder` - asc or desc (default: asc)
- `pageIndex` - Zero-based page number (default: 0)
- `pageSize` - Records per page (default: 25)

**Example Requests:**
```
GET /api/employees?search=john&pageSize=50
GET /api/employees?department=Engineering&sortBy=salary&sortOrder=desc
GET /api/employees?status=active&pageIndex=1&pageSize=10
```

## Usage Examples

### Basic Usage
```tsx
import { AdvancedDataTable, useEmployeeQuery } from '@/components/DataTable'
import { useState } from 'react'

export function EmployeeTable() {
  const [pageIndex, setPageIndex] = useState(0)
  const { data, isLoading, isError } = useEmployeeQuery({
    pageIndex,
    pageSize: 25,
  })

  return (
    <AdvancedDataTable
      data={data?.data ?? []}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
```

### With Sorting
```tsx
import { SortingState } from '@tanstack/react-table'

export function SortableEmployeeTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'lastName', desc: false },
  ])

  const { data, isLoading } = useEmployeeQuery({
    sorting,
    pageSize: 50,
  })

  return (
    <AdvancedDataTable
      data={data?.data ?? []}
      isLoading={isLoading}
      onSortingChange={setSorting}
    />
  )
}
```

### With Search & Filters
```tsx
export function FilteredEmployeeTable() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useEmployeeQuery({
    search,
    department,
    status,
    pageSize: 25,
  })

  return (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
      <select value={department} onChange={(e) => setDepartment(e.target.value)}>
        <option value="">All Departments</option>
        <option value="Engineering">Engineering</option>
      </select>

      <AdvancedDataTable
        data={data?.data ?? []}
        isLoading={isLoading}
      />
    </>
  )
}
```

### Complete Integration
```tsx
import { AdvancedDataTableExample } from '@/components/DataTable'

// Already includes search, filters, pagination, and sorting
export function Dashboard() {
  return <AdvancedDataTableExample />
}
```

## Performance Optimizations

1. **Virtual Scrolling** - Only renders visible rows (virtualization)
2. **React Query** - Automatic caching and background refetching
3. **Memoization** - Column definitions memoized with useMemo
4. **Type Safety** - Full TypeScript support prevents runtime errors

## Accessibility Features

- ✅ ARIA labels on checkbox inputs
- ✅ Role="grid" for table semantics
- ✅ role="columnheader" for headers
- ✅ role="row" and role="gridcell" for cells
- ✅ aria-sort for sortable columns
- ✅ Keyboard navigation support

## Testing

### Component Testing
```tsx
import { render, screen } from '@testing-library/react'
import { AdvancedDataTable } from '@/components/DataTable'

test('renders employee data', () => {
  const employees = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      department: 'Engineering',
      position: 'Developer',
      salary: 100000,
      joinDate: '2020-01-01T00:00:00Z',
      status: 'active' as const,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
  ]

  render(<AdvancedDataTable data={employees} />)
  expect(screen.getByText('John')).toBeInTheDocument()
})
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Related Documentation

- [TanStack Table v8](https://tanstack.com/table/v8)
- [React Virtual](https://tanstack.com/virtual/v3)
- [React Query](https://tanstack.com/query/latest)
