# Advanced Filtering & Search Infrastructure Guide

A complete guide to implementing composable, URL-persisted filtering across list views in the application.

## Overview

The advanced filtering system provides:

- **Multi-field filtering** with composable predicates
- **URL-based state persistence** for bookmarkable, shareable filter states
- **Debounced search** (300ms) for responsive UI with optimized API calls
- **Reusable components and hooks** for implementing filtering in any list view
- **Client-side and server-side filtering** support via MSW handlers

## Architecture

### Core Components

#### 1. `useFilters<T>()` Hook
Manages filter state via URL query parameters with debounced search support.

**Features:**
- URL synchronization via TanStack Router
- Separate tracking for raw search (immediate UI feedback) and debounced search (URL)
- Debouncing configuration (default: 300ms)
- Multi-filter management with partial updates

**Query Key Structure:**
```
Agents: ['agents'] or ['agents', { search, status, sortBy, order }]
Tasks: ['tasks'] or ['tasks', { search, status, priority }]
```

**Example:**
```tsx
const { filters, search, setSearch, setFilter, setFilters, clearFilters, hasActiveFilters } = useFilters<AgentFilterState>({
  debounceMs: 300,
})

// setSearch: Updates with debouncing for URL persistence
setSearch('alice') // Debounced to 300ms

// setFilter: Update single filter immediately
setFilter('status', 'active')

// setFilters: Batch update multiple filters
setFilters({ status: 'active', sortBy: 'name' })
```

#### 2. `FilterProvider` Component
Provides composable filter predicates and utilities for client-side filtering.

**Features:**
- Create and combine filter predicates (AND/OR logic)
- Apply predicates to data arrays
- Support for 6 operator types: equals, contains, in, gt, lt, range

**Supported Operators:**
- `equals`: Exact match
- `contains`: Case-insensitive substring (for strings)
- `in`: Array membership
- `gt`: Greater than (numbers)
- `lt`: Less than (numbers)
- `range`: Min/max range ({ min, max })

**Example:**
```tsx
<FilterProvider>
  <AgentsList />
</FilterProvider>

// Inside component:
const { applyFilters, createPredicate } = useFilterContext()

const predicates = [
  createPredicate<string>('name', 'contains', 'alice'),
  createPredicate<string>('status', 'equals', 'active'),
]

const filtered = applyFilters(agents, predicates)
```

#### 3. `FilterBar` Component
Pre-built UI for managing filters with search and select inputs.

**Features:**
- Multiple filter types: search, select
- Debounced search with clear button
- "Clear Filters" button when filters are active
- Configurable options

**Example:**
```tsx
const filterConfig: FilterBarConfig[] = [
  {
    label: 'Status',
    key: 'status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Idle', value: 'idle' },
    ],
  },
  {
    label: 'Search',
    key: 'search',
    type: 'search',
    placeholder: 'Search agents...',
  },
]

<FilterBar
  filters={filters}
  rawSearch={rawSearch}
  config={filterConfig}
  onFilterChange={setFilter}
  onSearchChange={setSearch}
  onClearFilters={clearFilters}
  hasActiveFilters={hasActiveFilters}
/>
```

#### 4. `SearchInput` Component
Reusable debounced search input with optional clear button.

## Implementation Patterns

### Pattern 1: Simple Filtering with URL Persistence

For basic filtering with URL state sync:

```tsx
import { useFilters } from '../../hooks/useFilters'
import { FilterBar, type FilterBarConfig } from '../../components/FilterBar'

interface MyFilterState extends FilterState {
  search?: string
  status?: string
}

export function MyListView() {
  const { filters, search, rawSearch, setSearch, setFilter, clearFilters, hasActiveFilters } =
    useFilters<MyFilterState>({ debounceMs: 300 })

  const { data = [] } = useMyQuery(filters)

  const config: FilterBarConfig[] = [
    { label: 'Search', key: 'search', type: 'search', placeholder: 'Search...' },
    { label: 'Status', key: 'status', type: 'select', options: [...] },
  ]

  return (
    <>
      <FilterBar
        filters={filters}
        rawSearch={rawSearch}
        config={config}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      {/* Render filtered data */}
    </>
  )
}
```

### Pattern 2: Client-Side Filtering with Predicates

When you need client-side filtering logic:

```tsx
import { useFilterContext } from '../../components/FilterProvider'
import { useFilters } from '../../hooks/useFilters'

export function AdvancedListView() {
  const { filters, search, setFilter, clearFilters } = useFilters<MyFilterState>()
  const { data = [] } = useMyQuery()
  const { applyFilters, createPredicate } = useFilterContext()

  const filtered = useMemo(() => {
    const predicates = []

    if (search) {
      predicates.push(createPredicate('name', 'contains', search))
    }

    if (filters.status) {
      predicates.push(createPredicate('status', 'equals', filters.status))
    }

    return applyFilters(data, predicates)
  }, [data, search, filters.status, applyFilters, createPredicate])

  return (
    <>
      <FilterBar {...filterProps} />
      {/* Render filtered data */}
    </>
  )
}
```

### Pattern 3: Server-Side Filtering (Recommended)

For better performance, filter on the server and use MSW handlers:

```tsx
// src/mocks/handlers/myResource.ts
http.get('/api/myresource', ({ request }) => {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') || ''

  let data = getAllData()

  // Apply filters
  if (search) {
    data = data.filter(item => item.name.includes(search))
  }
  if (status) {
    data = data.filter(item => item.status === status)
  }

  return HttpResponse.json(data)
})

// In component:
const { filters } = useFilters()
const { data } = useQuery({
  queryKey: ['myresource', filters],
  queryFn: async () => {
    const url = new URL('/api/myresource', window.location.origin)
    if (filters.search) url.searchParams.set('search', filters.search)
    if (filters.status) url.searchParams.set('status', filters.status)
    const res = await fetch(url)
    return res.json()
  }
})
```

## Integration with TanStack Query

### Query Key Structure

```tsx
// Simple queries
['agents']
['tasks']

// With filters
['agents', { search: 'alice', status: 'active' }]
['tasks', { search: '', status: 'todo', priority: 'high' }]
```

### Cache Invalidation

```tsx
const queryClient = useQueryClient()

// Invalidate all variants of agents
queryClient.invalidateQueries({ queryKey: ['agents'] })

// Invalidate specific filter combination
queryClient.invalidateQueries({
  queryKey: ['agents', { search: 'alice' }]
})
```

## Integration with TanStack Table

FilterBar can work alongside TanStack Table's column filtering:

```tsx
import { useTable } from '../../hooks/useTable'
import { useFilters } from '../../hooks/useFilters'

export function TableWithFiltering() {
  const { filters, setFilter } = useFilters()
  const { table, data } = useTable(filteredData)

  return (
    <>
      <FilterBar
        filters={filters}
        config={filterConfig}
        onFilterChange={setFilter}
      />
      <YourTable instance={table} />
    </>
  )
}
```

## API Reference

### `useFilters<T>(options?)`

```tsx
interface UseFiltersOptions {
  debounceMs?: number // Default: 300
  from?: string // Default: '__root__'
  replace?: boolean // Default: false
}

interface UseFiltersReturn<T> {
  filters: T // Current URL state
  search: string // Debounced search value
  rawSearch: string // Raw input (immediate)
  setSearch: (value: string) => void
  setFilter: <K>(key: K, value: unknown | null) => void
  setFilters: (updates: Partial<T>) => void
  clearFilter: <K>(key: K) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}
```

### `FilterBar`

```tsx
interface FilterBarConfig {
  label: string
  key: string
  type: 'select' | 'search'
  options?: FilterOption[] // For select
  placeholder?: string
}

interface FilterBarProps {
  filters: FilterState
  rawSearch?: string
  config: FilterBarConfig[]
  onFilterChange: (key: string, value: unknown) => void
  onSearchChange?: (value: string) => void
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}
```

### `useFilterContext()`

```tsx
interface FilterContextType {
  applyFilters: (data: any[], predicates: FilterPredicate[]) => any[]
  createPredicate: <T>(field: string, operator: string, value: T) => FilterPredicate<T>
  combinePredicates: (predicates: FilterPredicate[], logic: 'AND' | 'OR') => (item: any) => boolean
  getPredicatesFromFilters: (filters: Record<string, unknown>) => FilterPredicate[]
}
```

## URL Structure

Filters are stored as URL query parameters:

```
/agents?search=alice&status=active&sortBy=name&order=asc
/tasks?search=bug&status=todo&priority=high
```

This allows:
- **Bookmarking** filtered views
- **Sharing** filter states via links
- **Browser back/forward** navigation through filter history

## Best Practices

1. **Prefer server-side filtering** for large datasets
2. **Use debounced search** (300ms) for API calls
3. **Sync filter state to URL** for bookmarkable views
4. **Combine with TanStack Query** for cache management
5. **Use FilterProvider** for complex client-side predicates
6. **Show "Clear Filters" button** when filters are active

## Common Patterns

### Adding a New Filterable List

1. Create filter state interface extending `FilterState`
2. Use `useFilters<YourFilterState>()` hook
3. Configure `FilterBarConfig` array
4. Render `FilterBar` component
5. Pass filters to query hook
6. (Optional) Wrap with `FilterProvider` for client-side predicates

### Extending Existing Lists

1. Add new filter keys to state interface
2. Add new config items to `FilterBarConfig` array
3. Update MSW handler to support new query params
4. Update useQuery hook to include new filters
5. Test URL persistence and bookmarking

## Examples

### Full Example: Agents List with Advanced Filtering

See `src/pages/agents/AgentsList.tsx` for a complete implementation including:
- URL-persisted filtering
- Debounced search
- Status filtering
- Composable predicates
- Empty states
- Loading states
