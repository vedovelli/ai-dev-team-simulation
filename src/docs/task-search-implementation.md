# Task Search & Advanced Filtering Implementation Guide

## Overview

The task search feature enables full-text search and faceted filtering across tasks. It demonstrates efficient handling of larger result sets using TanStack Query caching and debounced input to reduce unnecessary API calls.

## Architecture

### Query Key Design

```typescript
const queryKey = ['tasks', 'search', { query, filters, page }]
```

The query key structure ensures:
- Results are cached per unique query combination
- Filter changes automatically invalidate and refetch results
- Pagination changes are cached separately
- Each unique search + filter + page combination has its own cache entry

### Stale-While-Revalidate Strategy

- **Stale time**: 30 seconds (search results change frequently)
- **GC time**: 60 seconds (keep in cache 2x stale time for refetch optimization)
- **Retry**: 3 attempts with exponential backoff (1s, 2s, 4s, max 30s)

## API Endpoint

### GET /api/tasks/search

**Query Parameters:**
- `q` (string): Full-text search query (searches title and description)
- `priority` (string): Filter by priority (low, medium, high)
- `status` (string): Filter by status (backlog, in-progress, in-review, done)
- `assignedAgent` (string): Filter by assigned agent name
- `sprint` (string): Filter by sprint ID
- `page` (number): Page number (default: 1)
- `perPage` (number): Items per page (default: 20, max: 100)

**Response:**
```typescript
interface TaskSearchResponse {
  results: SearchTask[]
  facets: SearchFacets
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

interface SearchTask {
  id: string
  title: string
  description: string
  assignee: string
  status: TaskStatus
  priority: TaskPriority
  sprint: string
  matchedFields: ('title' | 'description')[] // Fields that matched the search query
}

interface SearchFacets {
  priority: Record<TaskPriority, number>
  status: Record<TaskStatus, number>
  assignedAgent: Record<string, number>
  sprint: Record<string, number>
}
```

## Hook Usage

### Basic Search

```tsx
import { useTaskSearch } from '@/hooks'

export function TaskSearchComponent() {
  const search = useTaskSearch()

  return (
    <div>
      <input
        placeholder="Search tasks..."
        value={search.debouncedQuery}
        onChange={(e) => search.setQuery(e.target.value)}
      />

      {search.isLoading && <p>Searching...</p>}

      {search.hasSearchQuery && search.results.length === 0 && (
        <p>No tasks match "{search.debouncedQuery}"</p>
      )}

      {!search.hasSearchQuery && <p>Start typing to search tasks</p>}

      <ul>
        {search.results.map((task) => (
          <li key={task.id}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### With Filters

```tsx
export function TaskSearchWithFilters() {
  const search = useTaskSearch()

  return (
    <div>
      <input
        placeholder="Search tasks..."
        value={search.debouncedQuery}
        onChange={(e) => search.setQuery(e.target.value)}
      />

      <select
        value={search.filters.priority || ''}
        onChange={(e) =>
          search.setFilters({
            ...search.filters,
            priority: e.target.value || undefined,
          })
        }
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <div>
        <h4>Results</h4>
        {search.results.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      <div>
        <h4>Filters</h4>
        <p>Priority: {Object.entries(search.facets.priority).map(([key, count]) => `${key}: ${count}`)}</p>
        <p>Status: {Object.entries(search.facets.status).map(([key, count]) => `${key}: ${count}`)}</p>
      </div>
    </div>
  )
}
```

### Rendering Match Highlights

The `matchedFields` array indicates which fields matched the search query. Use this to highlight results:

```tsx
function TaskSearchResult({ task, query }: { task: SearchTask; query: string }) {
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  return (
    <div>
      <h3>
        {task.matchedFields.includes('title') ? (
          <span dangerouslySetInnerHTML={{ __html: highlightMatch(task.title, query) }} />
        ) : (
          task.title
        )}
      </h3>

      {task.matchedFields.includes('description') && (
        <p>
          <span dangerouslySetInnerHTML={{ __html: highlightMatch(task.description, query) }} />
        </p>
      )}
    </div>
  )
}
```

### Configuration Options

```tsx
const search = useTaskSearch({
  debounceMs: 500, // Default: 300ms
  perPage: 50,     // Default: 20
  staleTime: 60000, // Default: 30000 (30s)
})
```

## Distinguishing Empty States

The hook provides the `hasSearchQuery` flag to distinguish between:

1. **No search initiated**: `!hasSearchQuery && results.length === 0`
   - Show "Enter a search term" or similar prompt

2. **Search with no results**: `hasSearchQuery && results.length === 0`
   - Show "No tasks match '{query}'" with the search term

```tsx
{!search.hasSearchQuery && (
  <p className="text-gray-500">Start typing to search tasks</p>
)}

{search.hasSearchQuery && search.results.length === 0 && (
  <p className="text-orange-500">
    No tasks match "{search.debouncedQuery}"
  </p>
)}

{search.results.length > 0 && (
  <div>
    <p className="text-green-500">
      Found {search.pagination.total} task(s)
    </p>
  </div>
)}
```

## Pagination

```tsx
function Pagination({ search }: { search: UseTaskSearchReturn }) {
  return (
    <div>
      <button
        onClick={() => search.setPage(search.pagination.page - 1)}
        disabled={search.pagination.page === 1}
      >
        Previous
      </button>

      <span>
        Page {search.pagination.page} of {search.pagination.totalPages}
      </span>

      <button
        onClick={() => search.setPage(search.pagination.page + 1)}
        disabled={search.pagination.page === search.pagination.totalPages}
      >
        Next
      </button>
    </div>
  )
}
```

## Debouncing Details

The hook automatically debounces the search query to reduce API calls:

- **Default debounce**: 300ms after the user stops typing
- **Behavior**: Each new keystroke resets the debounce timer
- **Page reset**: When the query changes, pagination resets to page 1
- **Filter changes**: Changing filters also resets to page 1

```tsx
// Type quickly - only 1 API call after 300ms of inactivity
search.setQuery('authentication') // No API call yet
search.setQuery('authentication system') // No API call yet
// Wait 300ms → API call with query="authentication system"
```

## Performance Considerations

### Cache Efficiency

- Each unique `{ query, filters, page }` combination is cached separately
- Switching between searches keeps both in memory up to `gcTime`
- Pagination changes don't refetch the entire dataset

### Debouncing Efficiency

- Reduces API calls during typing (300ms default delay)
- Prevents redundant requests for similar queries

### Query Stale Times

- 30-second stale time balances freshness vs cache hit rate
- Search results change less frequently than other data types
- Refetch on window focus ensures fresh data when user returns

## Error Handling

The hook provides error information:

```tsx
const search = useTaskSearch()

if (search.isError) {
  return <p>Error: {search.error?.message}</p>
}

if (search.isLoading) {
  return <p>Loading...</p>
}
```

## Router Integration

For URL-based search state persistence, use the `useTaskSearchFilters` hook which integrates with TanStack Router:

```tsx
import { useTaskSearchFilters } from '@/hooks'

export function TaskSearchWithRouter() {
  const filters = useTaskSearchFilters()

  return (
    <div>
      <input
        placeholder="Search tasks..."
        value={filters.q}
        onChange={(e) => filters.setQuery(e.target.value)}
      />

      <select value={filters.priority || ''} onChange={(e) => filters.setPriority(e.target.value || null)}>
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* Filters are automatically synced to URL search params */}
      {/* Bookmark or share the URL to restore search state */}
    </div>
  )
}
```

The `useTaskSearchFilters` hook:
- Syncs all filter state to URL `searchParams`
- Restores filters on navigation via TanStack Router
- Supports shareable, bookmarkable search URLs
- Integrates with `useTaskSearch` for the actual data fetching

## Testing

Example test using React Testing Library:

```tsx
import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTaskSearch } from '@/hooks'

test('debounces search query', async () => {
  const { result } = renderHook(() => useTaskSearch())

  result.current.setQuery('test')
  expect(result.current.debouncedQuery).toBe('') // Not debounced yet

  await waitFor(() => {
    expect(result.current.debouncedQuery).toBe('test')
  })
})

test('distinguishes empty states', async () => {
  const { result } = renderHook(() => useTaskSearch())

  expect(result.current.hasSearchQuery).toBe(false)
  expect(result.current.results.length).toBe(0)

  result.current.setQuery('nonexistent')

  await waitFor(() => {
    expect(result.current.hasSearchQuery).toBe(true)
    expect(result.current.results.length).toBe(0)
  })
})
```
