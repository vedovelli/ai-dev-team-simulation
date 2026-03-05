# AdvancedTable UI Components

This directory contains the presentational layer for the AdvancedTable component with polished UI and responsive design.

## Components

### TableRow
Renders a table row with accessibility features and keyboard navigation support.

**Features:**
- Full keyboard navigation support (`tabIndex` management)
- Selection state with visual feedback
- ARIA row index for screen readers
- Hover and focus states
- Optional striped rows with `isEven` prop

**Props:**
```typescript
interface TableRowProps {
  children: ReactNode
  isSelected?: boolean
  isEven?: boolean
  onSelect?: () => void
  rowIndex?: number
  pageIndex?: number
  pageSize?: number
  className?: string
  style?: React.CSSProperties
}
```

### TableCell
Renders table cells (both header and data cells) with sorting indicators.

**Features:**
- Support for both `<th>` (header) and `<td>` (data) cells
- Sorting indicators with direction arrows
- Hover states for sortable headers
- Text alignment options (left, center, right)
- ARIA sort attributes for accessibility

**Props:**
```typescript
interface TableCellProps {
  children: ReactNode
  isHeader?: boolean
  isSortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onClick?: () => void
  className?: string
  align?: 'left' | 'center' | 'right'
  width?: string | number
}
```

### PaginationControls
Pagination controls with page size selector and navigation buttons.

**Variants:**
- **simple**: Just prev/next buttons with page indicator
- **extended**: Includes page size selector and total records display

**Features:**
- Disabled state management
- Keyboard accessible buttons
- Clear disabled state styling
- Loading state support
- ARIA labels for screen readers

**Props:**
```typescript
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
  pageSize: number
  pageSizeOptions?: number[]
  totalRecords: number
  isLoading?: boolean
  variant?: 'simple' | 'extended'
}
```

### TableSkeleton
Loading skeleton that mimics the table structure while data is loading.

**Features:**
- Animated gradient loading effect
- Customizable row and column count
- Matches table layout
- Proper ARIA labels for screen readers

**Props:**
```typescript
interface TableSkeletonProps {
  rowCount?: number
  columnCount?: number
  height?: string
}
```

### TableEmptyState
Displays when there is no data to show in the table.

**Features:**
- Customizable icon and message
- Optional action button for retry/reset
- Clear visual hierarchy
- Accessible markup

**Props:**
```typescript
interface TableEmptyStateProps {
  message?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}
```

### TableErrorState
Displays error messages with retry capability.

**Features:**
- Clear error messaging
- Optional error details (expandable)
- Retry button
- Professional styling
- ARIA alert role

**Props:**
```typescript
interface TableErrorStateProps {
  message?: string
  error?: Error
  onRetry?: () => void
  icon?: React.ReactNode
}
```

### FilterInput
Reusable input field for table filtering.

**Features:**
- Clear button that appears when input has value
- Label support
- Disabled state
- Proper accessibility attributes
- Callback-based updates

**Props:**
```typescript
interface FilterInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear: () => void
  label?: string
  disabled?: boolean
}
```

### ResponsiveTable & ResponsiveCard
Responsive wrappers for mobile-friendly table display.

**ResponsiveTable:**
- Wrapper that handles responsive layout
- Card view fallback for mobile
- Horizontal scroll on tablet

**ResponsiveCard:**
- Card component for mobile row display
- Shows fields as key-value pairs
- Easy to scan on small screens

## Accessibility Features

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader support
- Semantic HTML

## Responsive Design

Components are designed to work well across:
- Mobile (< 640px) - Card view with ResponsiveCard
- Tablet (640px - 1024px) - Horizontal scrolling
- Desktop (> 1024px) - Full table display

## Styling

All components use Tailwind CSS with a consistent color palette:
- **Primary**: Blue (blue-500, blue-600)
- **Secondary**: Slate (slate-* grays)
- **Success**: Green
- **Error**: Red
- **Warning**: Amber

## Usage Example

```tsx
import {
  AdvancedTable,
  useAdvancedTableState,
  useAdvancedTableQuery,
  TableSkeleton,
  TableEmptyState,
  FilterInput,
} from '@/components/AdvancedTable'

export function MyTable() {
  const [filter, setFilter] = useState('')
  const tableState = useAdvancedTableState()

  const { data, isLoading, isError } = useAdvancedTableQuery(
    '/api/items',
    {
      pageIndex: tableState.pageIndex,
      pageSize: tableState.pageSize,
      sorting: tableState.sorting,
      filters: { search: filter || undefined },
    }
  )

  return (
    <div className="space-y-4">
      <FilterInput
        value={filter}
        onChange={setFilter}
        onClear={() => setFilter('')}
        placeholder="Search..."
      />

      <AdvancedTable
        data={data.data}
        columns={columns}
        pageIndex={tableState.pageIndex}
        pageSize={tableState.pageSize}
        total={data.total}
        sorting={tableState.sorting}
        onPageIndexChange={tableState.setPageIndex}
        onPageSizeChange={tableState.setPageSize}
        onSortingChange={tableState.setSorting}
        isLoading={isLoading}
        isError={isError}
        variant="extended"
      />
    </div>
  )
}
```
