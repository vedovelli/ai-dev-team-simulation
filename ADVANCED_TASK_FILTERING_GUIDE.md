# Advanced Task Filtering Hook Implementation Guide

## Overview

The `useAdvancedTaskFilters` hook provides sophisticated task filtering and pagination capabilities with TanStack Query integration. It handles complex filtering scenarios with optimized query patterns including debounced search, multi-field filtering, and cache invalidation strategies.

## Features

### Filter Management
- **Priority Filtering**: Single-select filter for task priority (`low`, `medium`, `high`)
- **Status Filtering**: Multi-select filter for task status (`backlog`, `in-progress`, `in-review`, `done`)
- **Assignee Filtering**: Single-select searchable filter for task assignees
- **Date Range Filtering**: Range-based filtering for task creation dates
- **Text Search**: Debounced full-text search across task titles (300ms default)

### Query Optimization
- **Debounced Search**: Prevents excessive API calls during typing (configurable 300ms default)
- **Stale-While-Revalidate Pattern**: 30s stale time, 5-minute garbage collection window
- **KeepPreviousData**: Smooth UI transitions between filter states without cache clearing
- **Exponential Backoff Retry**: Automatic retry up to 3 times with exponential delays
- **Stable Query Keys**: Filter-based hash ensures proper cache invalidation

### Pagination
- Automatic pagination reset to page 1 when filters change
- Configurable page size (default 10)
- Full pagination metadata in return state

## Installation & Setup

```typescript
import { useAdvancedTaskFilters } from '@/hooks'
import { useQuery } from '@tanstack/react-query'
```

## Basic Usage

### Simple Filter Example

```typescript
import { useAdvancedTaskFilters } from '@/hooks'
import { useQuery } from '@tanstack/react-query'

function TaskList() {
  const filters = useAdvancedTaskFilters()

  const { data, isLoading, error } = useQuery({
    queryKey: filters.queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.state.priority) {
        params.append('priority', filters.state.priority)
      }

      if (filters.state.status.length > 0) {
        params.append('status', filters.state.status.join(','))
      }

      if (filters.debouncedSearch) {
        params.append('search', filters.debouncedSearch)
      }

      params.append('pageIndex', String(filters.page - 1))
      params.append('pageSize', String(filters.pageSize))

      const response = await fetch(`/api/tasks?${params}`)
      return response.json()
    },
    ...filters.queryOptions,
  })

  return (
    <div>
      {/* Filter UI */}
      <input
        type="text"
        value={filters.localSearch}
        onChange={(e) => filters.setSearchFilter(e.target.value)}
        placeholder="Search tasks..."
      />

      <select
        value={filters.priority || ''}
        onChange={(e) => filters.setPriorityFilter(
          (e.target.value || null) as TaskPriority | null
        )}
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* Task List */}
      {isLoading && <div>Loading...</div>}
      {error && <div>Error loading tasks</div>}
      {data?.data?.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}

      {/* Pagination */}
      <button
        onClick={() => filters.setPage(filters.page - 1)}
        disabled={filters.page === 1}
      >
        Previous
      </button>
      <span>Page {filters.page}</span>
      <button
        onClick={() => filters.setPage(filters.page + 1)}
        disabled={filters.page >= (data?.totalPages || 1)}
      >
        Next
      </button>
    </div>
  )
}
```

### Error Handling Example

```typescript
function TaskListWithErrorHandling() {
  const filters = useAdvancedTaskFilters()

  const { data, isLoading, error, isError } = useQuery({
    queryKey: filters.queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.state.priority) {
        params.append('priority', filters.state.priority)
      }

      if (filters.state.status.length > 0) {
        params.append('status', filters.state.status.join(','))
      }

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`)
      }
      return response.json()
    },
    ...filters.queryOptions,
    onError: (error: Error) => {
      console.error('Failed to load filtered tasks:', error)
      // Optionally show toast or error notification
    },
  })

  return (
    <div>
      {/* Filters */}
      <input
        type="text"
        value={filters.localSearch}
        onChange={(e) => filters.setSearchFilter(e.target.value)}
        placeholder="Search tasks..."
      />

      {/* Loading State */}
      {isLoading && <div className="spinner">Loading tasks...</div>}

      {/* Error State */}
      {isError && (
        <div className="error-alert">
          <p>Failed to load tasks: {error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {/* Success State */}
      {!isError && data?.data && (
        <>
          <div>Showing {data.data.length} of {data.total} tasks</div>
          {data.data.map((task) => (
            <div key={task.id}>{task.title}</div>
          ))}
        </>
      )}
    </div>
  )
}
```

### Advanced Multi-Filter Example

```typescript
function AdvancedTaskFilters() {
  const filters = useAdvancedTaskFilters({
    searchDebounceMs: 500, // Custom debounce delay
    staleTime: 60 * 1000,  // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
  })

  const { data, isLoading, isPreviousData } = useQuery({
    queryKey: filters.queryKey,
    queryFn: fetchFilteredTasks(filters.state),
    ...filters.queryOptions,
  })

  return (
    <div>
      {/* Priority Filter */}
      <label>Priority:</label>
      <select
        value={filters.priority || ''}
        onChange={(e) => filters.setPriorityFilter(
          (e.target.value || null) as TaskPriority | null
        )}
      >
        <option value="">All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Status Multi-Select */}
      <label>Status:</label>
      <div>
        {(['backlog', 'in-progress', 'in-review', 'done'] as const).map((status) => (
          <label key={status}>
            <input
              type="checkbox"
              checked={filters.status.includes(status)}
              onChange={() => filters.toggleStatus(status)}
            />
            {status}
          </label>
        ))}
      </div>

      {/* Assignee Select */}
      <label>Assignee:</label>
      <select
        value={filters.assignee || ''}
        onChange={(e) => filters.setAssigneeFilter(e.target.value || null)}
      >
        <option value="">All</option>
        <option value="agent-1">Agent 1</option>
        <option value="agent-2">Agent 2</option>
      </select>

      {/* Date Range */}
      <label>Created From:</label>
      <input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) =>
          filters.setDateRangeFilter(e.target.value || null, filters.dateTo)
        }
      />

      <label>Created To:</label>
      <input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) =>
          filters.setDateRangeFilter(filters.dateFrom, e.target.value || null)
        }
      />

      {/* Search */}
      <label>Search:</label>
      <input
        type="text"
        value={filters.localSearch}
        onChange={(e) => filters.setSearchFilter(e.target.value)}
        placeholder="Type to search (debounced)..."
      />

      {/* Filter Metadata */}
      <div>
        Active Filters: {filters.activeFilterCount}
        {filters.hasActiveFilters && (
          <button onClick={() => filters.clearAllFilters()}>
            Clear All
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading && <div>Loading...</div>}
      {isPreviousData && <div className="opacity-50">Previous data...</div>}

      <div>
        Showing {data?.data?.length || 0} of {data?.total || 0} tasks
      </div>

      {data?.data?.map((task) => (
        <div key={task.id} className={isPreviousData ? 'opacity-50' : ''}>
          {task.title}
        </div>
      ))}
    </div>
  )
}
```

## API Reference

### useAdvancedTaskFilters Options

```typescript
interface UseAdvancedTaskFiltersOptions {
  // Debounce delay for text search in milliseconds
  searchDebounceMs?: number // default: 300

  // Time until a query is considered stale
  staleTime?: number // default: 30000 (30 seconds)

  // Garbage collection time for unused queries
  gcTime?: number // default: 300000 (5 minutes)

  // Keep previous data while fetching new data
  keepPreviousData?: boolean // default: true
}
```

### Return Value

```typescript
interface UseAdvancedTaskFiltersReturn {
  // Current filter state
  state: AdvancedTaskFilterState
  queryKey: readonly [string, string, string, number, number]
  filterHash: string

  // Individual filter values
  priority: TaskPriority | null
  status: TaskStatus[]
  assignee: string | null
  localSearch: string
  debouncedSearch: string
  dateFrom: string | null
  dateTo: string | null
  page: number
  pageSize: number

  // Filter setters
  setPriorityFilter(priority: TaskPriority | null): void
  setStatusFilter(status: TaskStatus[]): void
  setAssigneeFilter(assignee: string | null): void
  setSearchFilter(search: string): void
  setDateRangeFilter(from: string | null, to: string | null): void
  toggleStatus(status: TaskStatus): void
  clearAllFilters(): void
  resetPagination(): void

  // Pagination
  setPage(page: number): void
  setPageSize(size: number): void

  // Filter metadata
  hasActiveFilters: boolean
  activeFilterCount: number

  // Query options for TanStack Query
  queryOptions: {
    staleTime: number
    gcTime: number
    keepPreviousData: boolean
    retry: (failureCount: number) => boolean
  }
}
```

## Advanced Patterns

### Pattern 1: Complete Filter UI Component

```typescript
export function TaskFilterPanel() {
  const filters = useAdvancedTaskFilters()
  const { data, isLoading } = useQuery({
    queryKey: filters.queryKey,
    queryFn: () => fetchTasks(filters.state),
    ...filters.queryOptions,
  })

  return (
    <form>
      {/* Each filter resets pagination automatically */}
      <fieldset>
        <legend>Priority</legend>
        <select
          value={filters.priority || ''}
          onChange={(e) => filters.setPriorityFilter(
            (e.target.value || null) as TaskPriority | null
          )}
        >
          <option value="">Any</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </fieldset>

      <fieldset>
        <legend>Status (multi-select)</legend>
        {(['backlog', 'in-progress', 'in-review', 'done'] as const).map((s) => (
          <label key={s}>
            <input
              type="checkbox"
              checked={filters.status.includes(s)}
              onChange={() => filters.toggleStatus(s)}
            />
            {s}
          </label>
        ))}
      </fieldset>

      {/* Results and pagination */}
    </form>
  )
}
```

### Pattern 2: Search with Debounce Indicator

```typescript
function SearchableTaskFilter() {
  const filters = useAdvancedTaskFilters({
    searchDebounceMs: 400,
  })

  const isSearching = filters.localSearch !== filters.debouncedSearch

  return (
    <div>
      <input
        type="text"
        value={filters.localSearch}
        onChange={(e) => filters.setSearchFilter(e.target.value)}
        placeholder="Search tasks..."
      />
      {isSearching && <span className="spinner" />}
      <span className="text-sm text-gray-500">
        Debounced search: "{filters.debouncedSearch}"
      </span>
    </div>
  )
}
```

### Pattern 3: Filter Presets

```typescript
function FilterPresets() {
  const filters = useAdvancedTaskFilters()

  const applyHighPriorityPreset = () => {
    filters.setPriorityFilter('high')
    filters.clearAllFilters()
    filters.setPriorityFilter('high')
  }

  const applyMyTasksPreset = () => {
    filters.clearAllFilters()
    filters.setAssigneeFilter('current-user-id')
    filters.setStatusFilter(['in-progress', 'in-review'])
  }

  return (
    <div>
      <button onClick={applyHighPriorityPreset}>
        High Priority Tasks
      </button>
      <button onClick={applyMyTasksPreset}>
        My Active Tasks
      </button>
    </div>
  )
}
```

## API Endpoint Contract

The backend `/api/tasks` endpoint should support:

```
GET /api/tasks?status=done,in-progress&priority=high&search=query&assignee=agent-1&dateFrom=2026-01-01&dateTo=2026-01-31&pageIndex=0&pageSize=10
```

**Query Parameters:**
- `status` (comma-separated for multi-value): Filter by status
- `priority`: Filter by single priority
- `search`: Full-text search (debounced on client)
- `assignee`: Filter by assignee ID
- `dateFrom` (ISO 8601): Filter tasks created after date
- `dateTo` (ISO 8601): Filter tasks created before date
- `pageIndex`: 0-based page index
- `pageSize`: Number of items per page

**Response Format:**
```json
{
  "data": [{ "id": "1", "title": "Task", ... }],
  "total": 42,
  "page": 1,
  "pageIndex": 0,
  "pageSize": 10,
  "totalPages": 5
}
```

**Response Fields:**
- `data`: Array of task objects for the current page
- `total`: Total number of tasks matching filters (not just current page)
- `page`: 1-based page number (convenience field, derived from pageIndex)
- `pageIndex`: 0-based page index (use this for next API requests)
- `pageSize`: Number of items per page
- `totalPages`: Total number of pages needed to show all results

Note: Both `page` and `pageIndex` are provided for convenience - use `pageIndex` when making subsequent requests as it matches the query parameter format.

## Testing

### Unit Tests

The `useAdvancedTaskFilters.test.ts` file includes tests for:
- Filter state initialization
- Each filter type (priority, status, assignee, search, date range)
- Debounce behavior with fake timers
- Pagination resets on filter changes
- Filter hash stability
- Active filter metadata
- Clear all filters functionality

Run tests with:
```bash
npm run test useAdvancedTaskFilters.test.ts
```

### Integration Tests

The `useAdvancedTaskFilters.integration.test.ts` file includes tests for:
- Single filter operations with mocked endpoints
- Multi-filter AND/OR logic
- Search debounce with real query lifecycle
- Date range filtering
- Pagination with filters
- Query key generation for cache invalidation
- Filter metadata accuracy through query lifecycle

Run integration tests with:
```bash
npm run test useAdvancedTaskFilters.integration.test.ts
```

## Performance Considerations

### Query Key Stability
Filter hashes use `btoa(JSON.stringify())` on sorted filter objects to ensure:
- Same filters always generate the same hash
- Different filter orders don't create duplicate cache entries
- Status arrays are sorted before hashing for stability

### Debounce Strategy
- Default 300ms debounce prevents excessive API calls during fast typing
- Configurable via `searchDebounceMs` option
- Automatic pagination reset prevents stale pagination states
- Previous debounce timers are cancelled on new input

### Cache Management
- `staleTime: 30s` - Queries are fresh for 30 seconds
- `gcTime: 5min` - Unused queries are cleared after 5 minutes
- `keepPreviousData: true` - Smooth UI without instant empty state

### Retry Logic
- Exponential backoff: 3 attempts maximum
- Failures after attempt 3 are not retried
- Suitable for temporary network issues

## Migration from useTaskFilters

The old `useTaskFilters` hook handled simple URL-based filtering. The new `useAdvancedTaskFilters` hook:
- Provides more granular control over state
- Integrates directly with TanStack Query patterns
- Includes debounced search out of the box
- Handles complex multi-filter scenarios
- Provides better TypeScript support

To migrate:
```typescript
// Old
const { status, priority, search } = useTaskFilters()

// New
const filters = useAdvancedTaskFilters()
const { state } = filters
// state.status, state.priority, state.search
```

## Common Patterns

### Clearing a Single Filter
```typescript
if (filters.priority !== null) {
  filters.setPriorityFilter(null)
}
```

### Checking if Filters Are Active
```typescript
if (filters.hasActiveFilters) {
  // Show "Clear All" button
  <button onClick={() => filters.clearAllFilters()}>
    Clear {filters.activeFilterCount} filters
  </button>
}
```

### Resetting Pagination Only
```typescript
// Use this when filters don't change but you want to go back to page 1
filters.resetPagination()
```

### Custom Debounce with Async Operations
```typescript
const filters = useAdvancedTaskFilters({ searchDebounceMs: 500 })

// The debouncedSearch is automatically available
// Use it directly in your query function
const { data } = useQuery({
  queryKey: filters.queryKey,
  queryFn: () => fetchTasks({
    search: filters.debouncedSearch, // Already debounced
    ...filters.state,
  }),
})
```

## Troubleshooting

### Query Key Changed Unexpectedly
- Check if status array order changed (use `toggleStatus` instead of direct array manipulation)
- Verify filter hash is stable using `console.log(filters.filterHash)`

### Search Not Triggering Query
- Ensure you're using `debouncedSearch`, not `localSearch`
- Check debounce delay with `searchDebounceMs` option
- Use fake timers in tests: `vi.useFakeTimers()` and `vi.advanceTimersByTime()`

### Pagination Resets Unexpectedly
- This is intentional - filters automatically reset pagination to page 1
- Use `resetPagination()` explicitly if you need to control this

### Stale Data in UI
- Use `isPreviousData` from `useQuery` to show loading state
- The `keepPreviousData` option ensures smooth transitions
- Increase `staleTime` if you want data to stay fresh longer

## See Also

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [useTaskAssignment Hook](./useTaskAssignment.ts) - Complementary hook for task assignments
- [Task Types](./types/task.ts) - Task type definitions
