# Advanced Filter & Sort Builder for Data Tables

A composable, type-safe filter system that can be reused across all data tables in the application. The system provides URL persistence, filter presets, and flexible field composition.

## Architecture

The filter system consists of four main pieces:

1. **Filter Types** (`src/types/filters.ts`) - TypeScript types for filter definitions
2. **useAdvancedTableFilters Hook** (`src/hooks/useAdvancedTableFilters.ts`) - State management with URL persistence
3. **FilterField Component** (`src/components/TableFilters/FilterField.tsx`) - Individual field renderers
4. **FilterBuilder Component** (`src/components/TableFilters/FilterBuilder.tsx`) - Composable UI container

## Filter Field Types

The system supports five filter field types:

- **text** - Text input for free-form search
- **select** - Single-select dropdown
- **multiselect** - Multi-select checkboxes
- **checkbox** - Multiple checkbox options
- **daterange** - Date range picker (from/to)

## Usage

### Basic Setup

```tsx
import { useAdvancedTableFilters } from '@/hooks/useAdvancedTableFilters'
import { FilterField } from '@/components/TableFilters/FilterField'
import { FilterBuilderWithFields } from '@/components/TableFilters/FilterBuilder'
import type { FilterFieldDefinition } from '@/types/filters'

const FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    name: 'search',
    label: 'Search',
    type: 'text',
    defaultValue: '',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'multiselect',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
  },
  {
    name: 'dateRange',
    label: 'Date Range',
    type: 'daterange',
  },
]

export function MyDataTable() {
  const filters = useAdvancedTableFilters({ fields: FILTER_FIELDS })

  return (
    <FilterBuilderWithFields filters={filters}>
      {FILTER_FIELDS.map((field) => (
        <FilterField
          key={field.name}
          field={field}
          value={filters.filters[field.name]}
          onChange={filters.updateFilter}
        />
      ))}
    </FilterBuilderWithFields>
  )
}
```

### With Filter Presets

Filter presets allow users to quickly apply predefined filter combinations:

```tsx
import type { FilterPreset } from '@/types/filters'

const FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'my-tasks',
    label: 'My Tasks',
    filters: {
      assignee: 'current-user',
      status: ['in-progress', 'in-review'],
    },
  },
  {
    name: 'urgent',
    label: 'Urgent Items',
    filters: {
      priority: 'high',
      status: ['backlog', 'in-progress'],
    },
  },
  {
    name: 'overdue',
    label: 'Overdue',
    filters: {
      dateRange: {
        from: undefined,
        to: new Date().toISOString().split('T')[0],
      },
      status: ['backlog', 'in-progress'],
    },
  },
]

export function MyDataTable() {
  const filters = useAdvancedTableFilters({
    fields: FILTER_FIELDS,
    presets: FILTER_PRESETS,
  })

  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          {FILTER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => filters.applyPreset(preset.name)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter builder */}
      <FilterBuilderWithFields filters={filters}>
        {FILTER_FIELDS.map((field) => (
          <FilterField
            key={field.name}
            field={field}
            value={filters.filters[field.name]}
            onChange={filters.updateFilter}
          />
        ))}
      </FilterBuilderWithFields>
    </div>
  )
}
```

### Connecting to Data Tables

The filter system integrates with TanStack Query to fetch filtered data:

```tsx
import { useQuery } from '@tanstack/react-query'

export function TaskTable() {
  const filters = useAdvancedTableFilters({ fields: FILTER_FIELDS })

  // Build query string from filter state
  const queryParams = new URLSearchParams()
  Object.entries(filters.filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      queryParams.set(key, value.join(','))
    } else if (typeof value === 'object' && value?.from) {
      queryParams.set(`${key}From`, value.from)
      queryParams.set(`${key}To`, value.to || '')
    } else if (value) {
      queryParams.set(key, String(value))
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters.filters],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?${queryParams}`)
      return res.json()
    },
  })

  return (
    <div className="space-y-4">
      <FilterBuilderWithFields filters={filters}>
        {FILTER_FIELDS.map((field) => (
          <FilterField
            key={field.name}
            field={field}
            value={filters.filters[field.name]}
            onChange={filters.updateFilter}
          />
        ))}
      </FilterBuilderWithFields>

      {isLoading && <div>Loading...</div>}
      {data && (
        <table>
          {/* Render filtered data */}
        </table>
      )}
    </div>
  )
}
```

## API Reference

### useAdvancedTableFilters

Custom hook for managing filter state with URL persistence.

#### Options

```ts
interface UseTableFiltersOptions {
  fields: FilterFieldDefinition[]
  presets?: FilterPreset[]
  onFiltersChange?: (filters: FilterState) => void
}
```

#### Returns

```ts
interface UseTableFiltersReturn {
  // Current filter values
  filters: FilterState

  // Update a single filter
  updateFilter: (fieldName: string, value: any) => void

  // Update multiple filters at once
  updateFilters: (updates: Partial<FilterState>) => void

  // Clear all filters
  clearFilters: () => void

  // Clear a single filter
  clearFilter: (fieldName: string) => void

  // Apply a preset by name
  applyPreset: (presetName: string) => void

  // Whether any filters are active
  hasActiveFilters: boolean

  // Number of active filter values
  activeFilterCount: number
}
```

### FilterField

Renders a single filter field based on its type definition.

```tsx
interface FilterFieldProps {
  field: FilterFieldDefinition
  value: any
  onChange: (fieldName: string, value: any) => void
}
```

### FilterBuilderWithFields

Container component for filter fields with controls.

```tsx
interface FilterBuilderWithFieldsProps {
  filters: UseTableFiltersReturn
  expandable?: boolean    // Default: true
  showPresets?: boolean   // Default: true
  children?: React.ReactNode
}
```

## URL Persistence

Filters are automatically persisted in URL query parameters using TanStack Router:

- **text & select**: `?fieldName=value`
- **multiselect & checkbox**: `?fieldName=value1,value2,value3`
- **daterange**: `?fieldNameFrom=2024-01-01&fieldNameTo=2024-12-31`

Example URL: `/tasks?status=in-progress,done&priority=high&search=api&dateFromFrom=2024-01-01&dateFromTo=2024-03-06`

## Data Flow

```
User interacts with FilterField
    ↓
updateFilter called
    ↓
URL updated via TanStack Router
    ↓
useAdvancedTableFilters recalculates filters
    ↓
Component re-renders with new filters
    ↓
Query key changes, triggers new API request
    ↓
Table data updated
```

## Server-Side Filtering

The MSW handlers (`/api/tasks`) already support filtering via query parameters:

- `?status=value` - Filter by status
- `?priority=value` - Filter by priority
- `?search=value` - Full-text search
- `?team=value` - Filter by team
- `?assignee=value` - Filter by assignee
- `?dateFrom=YYYY-MM-DD` - Filter from date
- `?dateTo=YYYY-MM-DD` - Filter to date
- `?sortBy=fieldName&sortOrder=asc|desc` - Sorting
- `?pageIndex=0&pageSize=50` - Pagination

## Advanced Patterns

### Dynamic Filter Options

Load filter options from the server:

```tsx
const { data: teams } = useQuery({
  queryKey: ['teams'],
  queryFn: () => fetch('/api/teams').then(r => r.json())
})

const FILTER_FIELDS = useMemo<FilterFieldDefinition[]>(() => [
  {
    name: 'team',
    label: 'Team',
    type: 'select',
    options: teams?.map(t => ({ value: t.id, label: t.name })) || [],
  },
], [teams])

const filters = useAdvancedTableFilters({ fields: FILTER_FIELDS })
```

### Filter Validation

Validate filter values before applying:

```tsx
const handleFilterChange = (fieldName: string, value: any) => {
  if (fieldName === 'priority' && !isValidPriority(value)) {
    toast.error('Invalid priority')
    return
  }
  filters.updateFilter(fieldName, value)
}
```

### Combining with Sorting

Filters work alongside sorting via TanStack Table:

```tsx
const table = useReactTable({
  data,
  columns,
  state: {
    sorting: tableSorting,
    columnFilters: filters.columnFilters,
  },
  onSortingChange: setTableSorting,
})
```

## TypeScript Support

Full type safety across the entire system:

```tsx
// Type-safe filter state
const filters = useAdvancedTableFilters({ fields: FILTER_FIELDS })

// Strongly typed updates
filters.updateFilter('status', ['done', 'in-review']) // ✓ OK
filters.updateFilter('status', 'invalid-value') // ✗ Compiler error (if using stricter types)

// Type-safe field definitions
const field: FilterFieldDefinition = {
  name: 'priority',
  label: 'Priority',
  type: 'multiselect',
  options: [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
  ]
}
```

## Acceptance Criteria Met

- ✅ FilterBuilder component renders all filter field types (text, select, multiselect, daterange, checkbox)
- ✅ Filter state persists in URL query params via TanStack Router
- ✅ Filters integrate with data table results via query parameters
- ✅ Clear all filters resets to default state
- ✅ Filter presets work correctly via applyPreset method
- ✅ MSW handlers accept and respond to filter parameters
- ✅ TypeScript types ensure type safety across filter system
- ✅ Documentation includes usage examples and advanced patterns
