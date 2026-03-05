# TanStack Router v1 Search Params Guide

This document describes how to use type-safe search parameters with TanStack Router v1 in this application.

## Overview

Search params (query parameters) are automatically synced with the URL, allowing you to persist filter states, pagination, and other view-specific data in the browser history.

## Schema Definitions

All search parameter schemas are defined in `router-types.ts` using Zod for validation and type safety.

### Available Schemas

#### `TasksSearchParamSchema`
For filtering and sorting tasks across the application:
- `status?: string` - Task status filter
- `priority?: string` - Priority level filter
- `search?: string` - Free-text search
- `team?: string` - Team filter
- `assignee?: string` - Assignee filter
- `dateFrom?: string` - Date range start
- `dateTo?: string` - Date range end
- `sortBy?: string` - Sort field
- `sortOrder?: 'asc' | 'desc'` - Sort direction
- `page?: number` - Pagination page (positive integer)
- `limit?: number` - Results per page (positive integer)

#### `AgentsSearchParamSchema`
For filtering and sorting agents:
- `filter?: string` - Free-text filter (searched across name, role, status)
- `sort?: 'name' | 'status' | 'role'` - Sort field
- `sortOrder?: 'asc' | 'desc'` - Sort direction

#### `SprintsSearchParamSchema`
For filtering sprint-related tasks:
- `status?: string` - Status filter
- `priority?: string` - Priority filter
- `search?: string` - Search query
- `team?: string` - Team filter
- `sprint?: string` - Sprint filter
- `assignee?: string` - Assignee filter

#### `AnalyticsSearchParamSchema`
For analytics page filters:
- `sprint?: string` - Sprint filter
- `status?: string` - Status filter
- `timeRange?: '7d' | '30d' | '90d' | 'all'` - Time range (defaults to '30d')

## Usage Patterns

### 1. Basic Route Configuration with Search Params

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { AgentsSearchParamSchema } from '../../lib/router-types'

export const Route = createFileRoute('/agents/')({
  component: AgentsDashboard,
  validateSearch: (search) => AgentsSearchParamSchema.parse(search),
})
```

The `validateSearch` function ensures that search params match the schema. Invalid params are caught and can be handled gracefully.

### 2. Reading Search Params in Components

```typescript
import { useSearch } from '@tanstack/react-router'
import { deserializeAgentsSearchParams } from '../../lib/router-types'

function AgentsDashboard() {
  const searchParams = useSearch({ from: '/agents/' })

  // Validate and deserialize
  const validatedParams = useMemo(() => {
    try {
      return deserializeAgentsSearchParams(searchParams)
    } catch {
      return {}
    }
  }, [searchParams])

  // Use the validated params
  const filter = validatedParams.filter || ''
  const sortOrder = validatedParams.sortOrder || 'asc'

  // ... rest of component
}
```

### 3. Updating Search Params and Navigation

```typescript
import { useNavigate } from '@tanstack/react-router'
import { serializeAgentsSearchParams } from '../../lib/router-types'

function AgentsDashboard() {
  const navigate = useNavigate()

  const handleFilterChange = (newFilter: string) => {
    navigate({
      to: '/agents/',
      search: serializeAgentsSearchParams({
        filter: newFilter || undefined,
        sort: currentSort,
        sortOrder: currentSortOrder,
      }),
    })
  }
}
```

### 4. Syncing Form State with Search Params

For complex filtering experiences, use a custom hook to sync search params with component state:

```typescript
export function useTaskFilters() {
  const navigate = useNavigate()
  const searchParams = useSearch()

  const status = isValidStatus(searchParams.status)
    ? searchParams.status
    : null

  const updateFilter = useCallback(
    (updates: Partial<TaskFilters>) => {
      navigate({
        search: {
          status: updates.status !== undefined ? updates.status : status,
          // ... other fields
        },
      })
    },
    [navigate, status]
  )

  return { status, updateFilter }
}
```

See `hooks/useTaskFilters.ts` for a complete example.

## Serialization & Deserialization

Search params in the URL are always strings. The serialization functions convert between typed objects and URL-safe strings:

### Serialization (Component → URL)

```typescript
const typed = {
  status: 'todo',
  priority: 'high',
  page: 2,
  limit: 20,
}

const urlParams = serializeTasksSearchParams(typed)
// Result: { status: 'todo', priority: 'high', page: '2', limit: '20' }
```

### Deserialization (URL → Component)

```typescript
const urlParams = { status: 'todo', page: '2' }

const typed = deserializeTasksSearchParams(urlParams)
// Result: { status: 'todo', page: 2 } with type safety
// Invalid params throw validation errors
```

## Type Safety Benefits

1. **Compile-time checking**: TypeScript prevents accessing non-existent search params
2. **Runtime validation**: Zod schemas validate params before use
3. **IDE autocomplete**: IntelliSense shows available params for each route
4. **Graceful degradation**: Invalid params are caught and can be cleared

Example:
```typescript
const params = useSearch({ from: '/agents/' })
// ✓ params.filter
// ✗ params.invalidField - TypeScript error!
```

## Browser History Integration

Search params automatically integrate with browser history:

- **Back button**: Navigating back restores previous search params
- **Forward button**: Returns to previously visited param combinations
- **URL sharing**: Share links with specific filters already applied
- **Bookmarks**: Save and restore exact page states with filters

## Testing Search Params

The test suite in `src/lib/__tests__/router-types.test.ts` covers:

- Schema validation for all param types
- Serialization and deserialization round-trips
- Parameter omission for undefined values
- Type coercion (string → number, etc.)
- Default value application

Run tests with:
```bash
npm test -- router-types
```

## Migration from Local State

If you're currently managing filters in local component state:

**Before:**
```typescript
const [filter, setFilter] = useState('')
const handleChange = (value) => setFilter(value)
```

**After:**
```typescript
const searchParams = useSearch()
const filter = searchParams.filter || ''
const handleChange = (value) => navigate({ search: { filter: value } })
```

Benefits:
- Filters persist across browser refresh
- Back/forward buttons work correctly
- Filters can be shared via URL
- Better SEO potential
- Simpler state management

## Best Practices

1. **Always validate search params**: Use `deserialize*` functions to ensure type safety
2. **Clear undefined params**: Don't include empty string or null values in serialization
3. **Use route-specific hooks**: Create custom hooks like `useTaskFilters` for complex filtering
4. **Test param changes**: Verify round-trip serialization/deserialization in tests
5. **Document search params**: Add comments explaining filter purposes
6. **Handle validation errors gracefully**: Catch deserialization errors and fall back to defaults

## Examples in Codebase

- **Agents Dashboard**: `/src/routes/agents/index.tsx` - Filter, sort, and sort order controls
- **Task Filters Hook**: `/src/hooks/useTaskFilters.ts` - Syncs multiple filter states
- **Sprint Board**: `/src/routes/sprints/index.tsx` - Status, priority, and search filtering

## Future Enhancements

- Add route guards validation in Sprint #21
- Implement code splitting per route in Sprint #21
- Add more complex multi-field filtering patterns
- Export filter presets to shareable URLs
