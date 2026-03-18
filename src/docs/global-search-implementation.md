# Global Search Implementation Guide

## Overview

Global search is a unified search system that allows users to search across all entities in the system: tasks, sprints, and agents. The implementation combines TanStack Query for data fetching, TanStack Router for URL state management, and a 300ms debounce to optimize API calls while typing.

## Architecture

### Query Key Structure

```typescript
queryKey: ['search', debouncedQuery, { type?, status?, page?, pageSize? }]
```

This ensures proper cache invalidation and differentiation between different search configurations.

### Stale Time & Cache Strategy

- **Stale Time**: 60 seconds (search results stay fresh briefly)
- **GC Time**: 5 minutes (data removed from cache after 5 minutes of inactivity)
- **Refetch Strategy**: Query only runs if `debouncedQuery` or filters have values

## API Endpoint

### GET /api/search

Unified search across all entities with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search query (searches titles/names and descriptions) |
| `type` | 'task' \| 'sprint' \| 'agent' | - | Filter by entity type (optional) |
| `status` | string | - | Filter by status (varies by entity type) |
| `page` | number | 1 | Page number for pagination |
| `pageSize` | number | 20 | Results per page (max 100) |

**Response:**

```typescript
interface GlobalSearchResponse {
  results: GlobalSearchResult[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

interface GlobalSearchResult {
  id: string
  type: 'task' | 'sprint' | 'agent'
  title: string
  description?: string
  matchedField: {
    field: string           // Which field matched ('title', 'description', etc)
    value: string          // The matched field value
    highlighted: boolean   // Whether this field should be highlighted in UI
  }
  metadata: {
    // Task-specific
    status?: TaskStatus
    priority?: TaskPriority
    assignee?: string
    sprintId?: string

    // Sprint-specific
    sprintStatus?: SprintStatus
    taskCount?: number

    // Agent-specific
    agentStatus?: string
    agentRole?: 'sr-dev' | 'junior' | 'pm'
  }
  createdAt: string
}
```

**Examples:**

```bash
# Search all entities for "auth"
GET /api/search?q=auth

# Search only tasks for "bug"
GET /api/search?q=bug&type=task

# Search tasks with "in-progress" status
GET /api/search?type=task&status=in-progress

# Search sprints with pagination
GET /api/search?type=sprint&page=2&pageSize=10

# Search agents with "active" status
GET /api/search?q=alice&type=agent&status=active
```

## Hook API: useGlobalSearch

### Basic Usage

```typescript
import { useGlobalSearch } from '@/hooks'

export function SearchComponent() {
  const search = useGlobalSearch()

  return (
    <>
      <input
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        placeholder="Search tasks, sprints, agents..."
      />

      {search.isLoading && <div>Loading...</div>}
      {search.isFetching && <span className="spinner" />}

      {search.results.map((result) => (
        <div key={`${result.type}-${result.id}`}>
          <h3>{result.title}</h3>
          {result.matchedField.highlighted && (
            <p className="highlight">
              {result.matchedField.field}: {result.matchedField.value}
            </p>
          )}
          <p>{result.type}</p>
        </div>
      ))}

      {search.error && <div>Error: {search.error.message}</div>}
    </>
  )
}
```

### Filtering by Entity Type

```typescript
export function TaskSearchOnly() {
  const search = useGlobalSearch()

  return (
    <>
      <button onClick={() => search.setFilters({ type: 'task' })}>
        Tasks Only
      </button>
      <button onClick={() => search.setFilters({ type: 'sprint' })}>
        Sprints Only
      </button>
      <button onClick={() => search.setFilters({ type: 'agent' })}>
        Agents Only
      </button>
      <button onClick={() => search.setFilters({ type: undefined })}>
        All Types
      </button>

      {/* Render results */}
    </>
  )
}
```

### Filtering by Status

```typescript
export function FilteredSearch() {
  const search = useGlobalSearch()

  return (
    <>
      <select
        onChange={(e) => search.setFilters({ status: e.target.value || undefined })}
      >
        <option value="">All Statuses</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
        <option value="active">Active</option>
      </select>

      {/* Render results */}
    </>
  )
}
```

### Pagination

```typescript
export function PaginatedSearch() {
  const search = useGlobalSearch()

  return (
    <>
      {/* Search input */}

      {/* Results */}
      {search.results.map((result) => (
        <div key={`${result.type}-${result.id}`}>{result.title}</div>
      ))}

      {/* Pagination controls */}
      <div>
        <button
          disabled={search.page === 1}
          onClick={() => search.setPage(search.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {search.page} of {Math.ceil(search.totalCount / search.pageSize)}
        </span>
        <button
          disabled={!search.hasMore}
          onClick={() => search.setPage(search.page + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}
```

### Router Integration with Query Params

The hook automatically syncs with TanStack Router, enabling:

- **Bookmark-able searches**: URLs preserve search state
- **Browser back/forward**: Navigation restores search results
- **Shareable links**: Users can share search results via URL

```typescript
// URL: ?q=auth&type=task&status=in-progress&page=1
// Automatically loaded by useGlobalSearch from router context

// Updating search also updates URL
search.setQuery('new query')      // ?q=new%20query
search.setFilters({ type: 'sprint' })  // ?type=sprint
search.setPage(2)                 // ?page=2
```

### Full Return Type

```typescript
interface UseGlobalSearchReturn {
  // Query state
  results: GlobalSearchResult[]
  isLoading: boolean          // True while initial fetch is happening
  isFetching: boolean         // True during any fetch (including background)
  isError: boolean
  error: Error | null

  // Pagination
  totalCount: number          // Total matching results across all pages
  hasMore: boolean            // Whether there are more pages to load
  page: number                // Current page (1-indexed)
  pageSize: number            // Results per page

  // Filter state
  query: string               // User input (local state, not debounced)
  debouncedQuery: string      // Debounced query (used for fetching)
  filters: GlobalSearchFilters // Current filter state

  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: Partial<GlobalSearchFilters>) => void
  setPage: (page: number) => void
  reset: () => void           // Clear all filters and reset to initial state
}
```

### Options

```typescript
const search = useGlobalSearch({
  debounceMs: 300,    // Debounce delay in milliseconds (default: 300)
  pageSize: 20,       // Results per page (default: 20)
  staleTime: 60000,   // Cache stale time in milliseconds (default: 60000)
})
```

## Debounce Behavior

The hook implements a 300ms debounce on the search query:

1. **User types**: Input is immediately updated in local state (`query`)
2. **Typing pauses**: After 300ms of inactivity, the debounced query updates
3. **API call**: Once debounced query changes, TanStack Query fetches new results
4. **URL sync**: Router query params update with the new debounced search state

This prevents excessive API calls while still providing responsive UI feedback.

```
User input: "a" -> "au" -> "aut" -> "auth" (each ~100ms apart)
└─ Local state updates immediately
└─ Debounce timer resets on each keystroke
└─ After 300ms idle → "auth" becomes debouncedQuery
└─ TanStack Query fetches with ?q=auth
└─ Results update in UI
```

## Matched Field Highlighting

Each search result includes a `matchedField` object for UI highlighting:

```typescript
{
  id: 'task-42',
  title: 'Fix authentication bug',
  matchedField: {
    field: 'title',
    value: 'Fix authentication bug',
    highlighted: true  // Should be highlighted in UI
  }
}
```

**Usage in components:**

```typescript
{result.matchedField.highlighted && (
  <div className="highlight">
    <strong>{result.matchedField.field}:</strong> {result.matchedField.value}
  </div>
)}
```

## Type Safety

All types are exported and can be imported:

```typescript
import type {
  UseGlobalSearchReturn,
  UseGlobalSearchOptions,
  GlobalSearchResult,
  GlobalSearchResponse,
  GlobalSearchFilters,
  GlobalSearchEntityType,
  MatchedField,
} from '@/hooks'
```

## Performance Considerations

### Debounce Prevents API Overload

```typescript
// Without debounce: 10 API calls for "auth"
setQuery('a')     // API call
setQuery('au')    // API call
setQuery('aut')   // API call
setQuery('auth')  // API call
...

// With 300ms debounce: Only 1 API call
setQuery('a')     // Debounce timer starts
setQuery('au')    // Reset timer
setQuery('aut')   // Reset timer
setQuery('auth')  // Reset timer
// After 300ms → Single API call
```

### Query Key Structure Enables Cache Reuse

```typescript
// Same query, same filters = cached result
useGlobalSearch() // queryKey: ['search', 'auth', {...}]
// ...
useGlobalSearch() // queryKey: ['search', 'auth', {...}] - CACHED!

// Different page = new fetch
useGlobalSearch().setPage(2) // queryKey: ['search', 'auth', {..., page: 2}]
```

### Stale-While-Revalidate Pattern

- Results are used immediately even if stale (60 seconds)
- Background refetch happens automatically for active queries
- User sees instant results, then fresh data arrives

## Common Patterns

### Global Search Modal

```typescript
function GlobalSearchModal() {
  const search = useGlobalSearch()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <input
        autoFocus
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        placeholder="Search (Cmd+K)..."
      />
      {search.results.slice(0, 5).map((result) => (
        <div key={`${result.type}-${result.id}`}>{result.title}</div>
      ))}
    </Dialog>
  )
}
```

### Search with Type Tabs

```typescript
function SearchWithTabs() {
  const search = useGlobalSearch()
  const types: GlobalSearchEntityType[] = ['task', 'sprint', 'agent']

  return (
    <>
      <div role="tablist">
        <button
          role="tab"
          onClick={() => search.setFilters({ type: undefined })}
          className={!search.filters.type ? 'active' : ''}
        >
          All ({search.totalCount})
        </button>
        {types.map((type) => (
          <button
            key={type}
            role="tab"
            onClick={() => search.setFilters({ type })}
            className={search.filters.type === type ? 'active' : ''}
          >
            {type}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {search.results.map((result) => (
          <div key={`${result.type}-${result.id}`}>{result.title}</div>
        ))}
      </div>
    </>
  )
}
```

## Testing

The MSW handler provides realistic mock data:

```typescript
// In tests
import { server } from '@/mocks/server'

test('searches tasks', async () => {
  const response = await fetch('/api/search?q=auth&type=task')
  const data = await response.json()
  expect(data.results).toHaveLength(1) // "Implement authentication"
})
```

## Future Enhancements

- [ ] Faceted search (refine by type, status simultaneously)
- [ ] Recent searches history
- [ ] Saved search filters
- [ ] Search analytics (popular searches)
- [ ] Fuzzy matching for typo tolerance
- [ ] Advanced search syntax (quotes, operators)
