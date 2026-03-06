# SimpleTable Component & useTable Hook

A lightweight, accessible table solution providing 80% of TanStack Table's value with minimal complexity. Perfect for simple to moderately complex data display needs.

## Features

- ✅ Client-side sorting (ascending/descending toggle)
- ✅ Client-side filtering/search
- ✅ Column configuration with type safety
- ✅ Semantic HTML (`<thead>`, `<tbody>`, `<th>`, `<td>`)
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Loading and empty states
- ✅ Extensible with custom cell renderers
- ✅ Tailwind CSS styling
- ✅ Full TypeScript generics support

## Quick Start

### Basic Usage

```tsx
import { SimpleTable } from '@/components/SimpleTable'
import type { ColumnConfig } from '@/hooks/useTable'

interface User {
  id: number
  name: string
  email: string
}

const columns: ColumnConfig<User>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
]

const data: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
]

export function MyTable() {
  return <SimpleTable data={data} columns={columns} />
}
```

## API Reference

### SimpleTable Component

**Props:**

```typescript
interface SimpleTableProps<T extends object> {
  data: T[]                          // Array of row objects
  columns: ColumnConfig<T>[]         // Column configuration
  isLoading?: boolean                // Show loading state (default: false)
  emptyMessage?: string              // Message when no data (default: "No data found")
}
```

**Example:**

```tsx
<SimpleTable
  data={users}
  columns={userColumns}
  isLoading={isLoading}
  emptyMessage="No users found"
/>
```

### useTable Hook

A React hook that manages table state (sorting, filtering). Use this for advanced cases where you need custom rendering or want to use `SimpleTableContent`.

**Props:**

```typescript
interface UseTableState<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  sortKey?: keyof T              // Initial sort column
  sortDirection?: 'asc' | 'desc' // Initial sort direction
  searchTerm?: string            // Initial search term
  isLoading?: boolean            // Loading state
}
```

**Return Value:**

```typescript
interface UseTableReturn<T> {
  displayedData: T[]              // Sorted and filtered data
  sortedAndFilteredData: T[]      // Same as displayedData
  columns: ColumnConfig<T>[]      // Column config
  sortKey?: keyof T               // Current sort column
  sortDirection: 'asc' | 'desc'   // Current sort direction
  searchTerm: string              // Current search term
  isLoading: boolean              // Loading state
  setSortKey: (key: keyof T) => void
  toggleSort: (key: keyof T) => void
  setSearchTerm: (term: string) => void
  getSortIcon: (key: keyof T) => '↑' | '↓' | null
}
```

**Example:**

```tsx
const tableState = useTable({
  data: users,
  columns: userColumns,
})

return (
  <div>
    <input
      value={tableState.searchTerm}
      onChange={(e) => tableState.setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
    {/* Use tableState.displayedData for custom rendering */}
  </div>
)
```

### ColumnConfig Interface

Defines how each column should behave:

```typescript
interface ColumnConfig<T> {
  key: keyof T                              // Data accessor
  label: string                             // Column header label
  sortable?: boolean                        // Enable sorting (default: true)
  filterable?: boolean                      // Include in search (default: true)
  render?: (value: any) => React.ReactNode  // Custom cell renderer
}
```

**Example:**

```typescript
const columns: ColumnConfig<User>[] = [
  {
    key: 'name',
    label: 'User Name',
    sortable: true,
    filterable: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (value: string) => (
      <span className={value === 'active' ? 'text-green-600' : 'text-red-600'}>
        {value}
      </span>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    filterable: false,
    render: (_, row) => (
      <button onClick={() => handleEdit(row)}>Edit</button>
    ),
  },
]
```

## Accessibility

The components include built-in accessibility features:

- **ARIA roles**: `table`, `row`, `columnheader`, `cell`
- **ARIA sort**: `ascending`, `descending`, `none`
- **Keyboard navigation**: Column headers are focusable and can be sorted with Enter/Space
- **Search label**: Input has descriptive `aria-label`
- **Loading state**: Uses `role="status"` and `aria-live="polite"`

All ARIA attributes are automatically managed—no additional configuration needed.

## Styling

The components use **Tailwind CSS** classes. Customize by:

1. **Modifying the component**: Edit `SimpleTable.tsx` to change class names
2. **Extending with CSS**: Add your own CSS module imports
3. **Using `render` prop**: Custom cell renderers have full control

## Advanced Usage

### Custom Cell Rendering

```tsx
const columns: ColumnConfig<Task>[] = [
  {
    key: 'title',
    label: 'Task Title',
  },
  {
    key: 'priority',
    label: 'Priority',
    render: (value: string) => {
      const colors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800',
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value]}`}>
          {value}
        </span>
      )
    },
  },
]
```

### Disabled Sorting on Specific Columns

```tsx
const columns: ColumnConfig<Data>[] = [
  { key: 'id', label: 'ID', sortable: false },
  { key: 'name', label: 'Name', sortable: true },
]
```

### Exclude Columns from Search Filter

```tsx
const columns: ColumnConfig<Data>[] = [
  { key: 'id', label: 'ID', filterable: false },
  { key: 'name', label: 'Name', filterable: true },
]
```

### Loading State

```tsx
<SimpleTable
  data={data}
  columns={columns}
  isLoading={isLoading}
/>
```

Shows a centered "Loading..." message instead of the table.

## Migration to TanStack Table

This hook is designed as a stepping stone. When you need features beyond sorting/filtering:

1. `ColumnConfig` structure is similar to TanStack `ColumnDef`
2. Can gradually migrate by converting columns as needed
3. Allows coexistence with TanStack Table for feature-rich sections

```tsx
// Convert ColumnConfig to TanStack ColumnDef
const tanstackColumns: ColumnDef<T>[] = columns.map((col) => ({
  accessorKey: col.key,
  header: col.label,
  enableSorting: col.sortable !== false,
  // ... additional TanStack-specific config
}))
```

## Performance Considerations

- **Memoization**: Uses `useMemo` for filtering and sorting
- **Scalability**: Works efficiently with data up to ~5,000 rows
- **Large datasets**: Consider `VirtualizedDataTable` or TanStack Table for 10,000+ rows
- **Search**: O(n*m) complexity where n=rows, m=filterable columns

## Testing

Example test setup:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SimpleTable } from './SimpleTable'

test('sorts by column when header is clicked', async () => {
  const user = userEvent.setup()
  render(<SimpleTable data={mockData} columns={mockColumns} />)

  const nameHeader = screen.getByRole('columnheader', { name: /name/i })
  await user.click(nameHeader)

  // Verify sort applied
})

test('filters data by search term', async () => {
  const user = userEvent.setup()
  render(<SimpleTable data={mockData} columns={mockColumns} />)

  const searchInput = screen.getByRole('textbox', { name: /search/i })
  await user.type(searchInput, 'alice')

  // Verify filtering applied
})
```

## Browser Support

- Modern browsers with ES2020+ support
- Requires React 16.8+ (hooks)
- Tailwind CSS v3 or v4

## Files

- `src/hooks/useTable.ts` - Core hook
- `src/components/SimpleTable/SimpleTable.tsx` - Component
- `src/components/SimpleTable/SimpleTableExample.tsx` - Example usage
- `src/components/SimpleTable/index.ts` - Public exports
