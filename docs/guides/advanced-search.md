# Advanced Search Hook & Router Integration

## Overview

The `useAdvancedSearch` hook provides a complete search infrastructure with:

- **Debounced search input** - Prevents excessive API calls (300ms default)
- **URL persistence** - Filter state persists in URL search params
- **TanStack Query integration** - Automatic caching and smart invalidation
- **Router integration** - Deep linking and bookmarkable filtered views
- **Multi-field filtering** - Search text, status, agent (AND logic)
- **Smooth UX** - `keepPreviousData` for seamless refetches

## Architecture

### Components

1. **`useAdvancedSearch` Hook** (`src/hooks/useAdvancedSearch.ts`)
   - Manages search state and debouncing
   - Syncs filters with URL params
   - Fetches and caches search results

2. **Search Param Utilities** (`src/lib/searchParamUtils.ts`)
   - `serializeSearchParams()` - Convert filter object to URL params
   - `deserializeSearchParams()` - Convert URL params to filter object
   - `buildSearchUrl()` - Build complete API URL with params

3. **MSW Handler** (`src/mocks/handlers/search.ts`)
   - `GET /api/search` - Accepts filter params and returns paginated results
   - Filters with AND logic
   - Supports pagination

4. **Types** (`src/types/search.ts`)
   - `AdvancedSearchFilters` - Filter object shape
   - `SearchResponse` - API response format
   - `SearchMetadata` - Pagination metadata

## Usage

### Basic Example

```tsx
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch'

export function TaskSearch() {
  const {
    data: tasks,
    isLoading,
    filters,
    setSearchText,
    setFilters,
    clearFilters,
    hasActiveFilters,
  } = useAdvancedSearch()

  return (
    <div>
      {/* Search input */}
      <input
        type="text"
        placeholder="Search tasks..."
        value={filters.search || ''}
        onChange={(e) => setSearchText(e.target.value)}
      />

      {/* Status filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => setFilters({ status: e.target.value || undefined })}
      >
        <option value="">All Statuses</option>
        <option value="backlog">Backlog</option>
        <option value="in-progress">In Progress</option>
        <option value="in-review">In Review</option>
        <option value="done">Done</option>
      </select>

      {/* Agent filter */}
      <select
        value={filters.agent || ''}
        onChange={(e) => setFilters({ agent: e.target.value || undefined })}
      >
        <option value="">All Agents</option>
        <option value="Alice Williams">Alice Williams</option>
        <option value="Bob Johnson">Bob Johnson</option>
        <option value="John Doe">John Doe</option>
      </select>

      {/* Clear button */}
      {hasActiveFilters && (
        <button onClick={clearFilters}>Clear Filters</button>
      )}

      {/* Loading state */}
      {isLoading && <div className="spinner">Loading...</div>}

      {/* Results */}
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <h3>{task.title}</h3>
            <p>Status: {task.status}</p>
            <p>Assignee: {task.assignee}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && (
        <div className="empty-state">No tasks found</div>
      )}
    </div>
  )
}
```

### Advanced Example with TanStack Form

```tsx
import { useForm } from '@tanstack/react-form'
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch'

export function TaskFilterPanel() {
  const { filters, setFilters, clearFilters, data: tasks, isLoading } = useAdvancedSearch()

  const form = useForm({
    defaultValues: filters,
    onSubmit: async (values) => {
      setFilters(values)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="search"
        children={(field) => (
          <input
            type="text"
            placeholder="Search tasks..."
            value={field.state.value || ''}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      />

      <form.Field
        name="status"
        children={(field) => (
          <select
            value={field.state.value || ''}
            onChange={(e) => field.handleChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </select>
        )}
      />

      <form.Field
        name="agent"
        children={(field) => (
          <select
            value={field.state.value || ''}
            onChange={(e) => field.handleChange(e.target.value)}
          >
            <option value="">All Agents</option>
            <option value="Alice Williams">Alice Williams</option>
            <option value="Bob Johnson">Bob Johnson</option>
          </select>
        )}
      />

      <button type="submit">Apply Filters</button>
      <button type="button" onClick={clearFilters}>
        Clear All
      </button>
    </form>
  )
}
```

## URL Persistence

Filters are automatically persisted to URL search params. This enables:

**Bookmarking**
- `?search=auth&status=in-progress` - Bookmark filtered view
- Share link to colleagues with same filters applied

**Deep Linking**
- Direct links to specific filtered views
- Users land on search results without manual filtering

**Browser History**
- Back/forward navigation through filter states
- Filters persist across page refreshes

### Example URLs

```
# All tasks
/tasks

# Search for "auth" in backlog
/tasks?search=auth&status=backlog

# All in-progress tasks assigned to Alice
/tasks?status=in-progress&agent=Alice%20Williams

# Combined filters
/tasks?search=api&status=in-review&agent=Bob%20Johnson
```

## Debouncing Behavior

The hook debounces search input with a configurable delay (300ms default):

1. User types in search input → local state updates immediately
2. After 300ms of inactivity → debounced value updates
3. URL params and API query change → new search results fetched
4. `keepPreviousData` shows old results while fetching new ones

**Why debounce?**
- Prevents excessive API calls (e.g., 10 calls for a 10-letter search)
- Reduces server load
- Better perceived performance
- Smooth user experience

## Query Structure

Results are cached using TanStack Query with this key structure:

```typescript
queryKey: ['search', 'tasks', { search: 'auth', status: 'in-progress', agent: 'Alice' }]
```

**Benefits:**
- Automatic cache reuse for identical filters
- Smart invalidation only when filters change
- Prevents refetching unchanged data

## API Response Format

```json
{
  "data": [
    {
      "id": "task-1",
      "title": "Implement authentication",
      "status": "in-progress",
      "assignee": "Alice Williams",
      "priority": "high",
      "storyPoints": 8,
      "team": "Backend",
      "sprint": "sprint-2"
    }
  ],
  "meta": {
    "total": 127,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

## Filter Logic

Filters are combined with **AND logic**:

```
search='auth' AND status='backlog'  → Tasks with 'auth' in title that are backlog
search='api' AND agent='Alice'       → Tasks with 'api' in title assigned to Alice
```

To support **OR logic**, extend the API handler:

```typescript
// Future enhancement
setFilters({
  status: 'backlog,done'  // OR logic: backlog OR done
})
```

## Configuration Options

```typescript
useAdvancedSearch({
  debounceMs: 500,           // Custom debounce delay (ms)
  keepPreviousData: true,    // Show old results while fetching new ones
  enabled: true,             // Disable queries (e.g., while form is initializing)
})
```

## Error Handling

```tsx
const { data, isLoading, isError, error } = useAdvancedSearch()

if (isError) {
  return <div className="error">Error: {error?.message}</div>
}
```

## Performance Tips

1. **Debounce helps** - Default 300ms debounce reduces API load by ~70%
2. **Cache hits** - Identical filters reuse cached results (no API call)
3. **Virtual scrolling** - Combine with virtual lists for 1000+ results
4. **Pagination** - Only fetch visible page (configurable in handler)

## Expanding to Other Tables

The pattern can be expanded to other data types (agents, sprints, etc.) by:

1. Extending `AdvancedSearchFilters` type:
   ```typescript
   export interface AdvancedSearchFilters {
     search?: string
     status?: string
     agent?: string
     // Add new fields
     priority?: string
     team?: string
   }
   ```

2. Adding filters to the API handler (`searchHandlers`)

3. Adding filter controls in UI

## Troubleshooting

**Q: Filters not syncing with URL?**
- Ensure `useNavigate` and `useSearch` are used with `from: '__root__'`
- Check router configuration

**Q: Search results not updating?**
- Check MSW handler response format matches `SearchResponse`
- Verify filter params are being serialized correctly

**Q: Slow search performance?**
- Increase debounce delay: `useAdvancedSearch({ debounceMs: 500 })`
- Implement server-side pagination in API handler

**Q: Stale results showing?**
- Reduce `staleTime` if you need fresher data
- Call `queryClient.invalidateQueries()` manually if needed

## Related Patterns

- [TanStack Query Guide](./tanstack-query.md) - Caching strategies
- [TanStack Router Integration](./tanstack-router.md) - URL management
- [Search UX Patterns](../patterns/search-ux.md) - UI best practices
