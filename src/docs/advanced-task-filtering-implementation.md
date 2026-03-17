# Advanced Task Filtering System — Implementation Guide

## Overview

FAB-279 implements a composable, URL-synced task filtering system with TanStack Router and TanStack Query integration. The system provides:

- **Composable Filter Operators**: AND/OR logic across filter dimensions
- **URL Persistence**: Filter state in search params for shareable, bookmarkable views
- **Debounced Updates**: Configurable debounce (default 300ms) to avoid excessive queries
- **Built-in Presets**: "My Tasks", "This Sprint", "Overdue", "Unassigned"
- **Cache Invalidation**: Automatic TanStack Query invalidation on filter changes
- **Multi-value Filtering**: Support for multiple values per filter dimension

## Architecture

### Files Structure

```
src/
├── types/
│   └── task-filter-presets.ts          # Filter preset types and constants
├── hooks/
│   ├── useTaskFilters.ts               # Enhanced filtering hook with Router integration
│   └── queries/tasks.ts                # Updated query hook with multi-value support
├── mocks/
│   └── handlers/tasks.ts               # MSW handler with filtering support
├── components/
│   └── TaskFilterPanel.tsx             # UI component for filter controls
└── docs/
    └── advanced-task-filtering-implementation.md  # This file
```

## Key Components

### 1. Task Filter Presets (`src/types/task-filter-presets.ts`)

Defines filter operators and preset structures:

```typescript
// Filter criteria with support for single or multiple values
interface TaskFilterCriteria {
  status?: TaskStatus | TaskStatus[]
  assignee?: string | string[]
  priority?: TaskPriority | TaskPriority[]
  sprint?: string | string[]
}

// Filter operator (AND/OR logic)
interface FilterOperator {
  type: 'AND' | 'OR'
  criteria: TaskFilterCriteria
}

// Preset definition
interface TaskFilterPreset {
  id: string
  name: string
  description: string
  operators: FilterOperator[]
  isDefault?: boolean
}

// Built-in presets
export const BUILT_IN_PRESETS = {
  MY_TASKS: { /* "My Tasks" preset */ },
  THIS_SPRINT: { /* "This Sprint" preset */ },
  OVERDUE: { /* "Overdue" preset */ },
  UNASSIGNED: { /* "Unassigned" preset */ },
}
```

### 2. Enhanced Task Filters Hook (`src/hooks/useTaskFilters.ts`)

Manages filter state, URL synchronization, and debouncing:

```typescript
export function useTaskFilters(debounceMs = 300) {
  // Current filter state (from URL params)
  const {
    status,      // TaskStatus[]
    priority,    // TaskPriority[]
    search,      // string
    team,        // string
    sprint,      // string[]
    assignee,    // string[]
    page,        // number
    pageSize,    // number
  } = ...

  // Methods
  setFilter(key, value)        // Update a single filter
  clearFilter(key)             // Clear a specific filter
  clearAllFilters()            // Reset all filters to defaults
  applyFilters(updates)        // Apply multiple filter updates (with debounce)
  applyPreset(presetId)        // Apply a filter preset
  buildSearchParams(filters)   // Build URL params from filter state

  // Utilities
  presets                       // Array of available presets
  getPresetById(id)            // Get preset by ID
  pendingFilters               // Filters awaiting debounce completion
}
```

### 3. MSW Handler with Filtering (`src/mocks/handlers/tasks.ts`)

HTTP handler supporting multi-value filters:

```
GET /api/tasks?status=todo&status=in-progress&priority=high&pageIndex=0&pageSize=10

Response:
{
  data: Task[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

**Filter Logic**:
- OR logic **within** each dimension (e.g., status=todo OR in-progress)
- AND logic **between** dimensions (e.g., status AND priority AND assignee)

### 4. Task Filter Panel Component (`src/components/TaskFilterPanel.tsx`)

React component for filter UI:

```tsx
<TaskFilterPanel />

// Features:
// - Preset selector dropdown
// - Search input
// - Multi-select checkboxes for status/priority
// - Select dropdowns for assignee/sprint
// - Active filter tags with clear buttons
// - Clear all filters button
// - Responsive layout
```

## Usage Examples

### Basic Filtering

```tsx
import { useTaskFilters } from '@/hooks/useTaskFilters'
import { useTasks } from '@/hooks/queries/tasks'

function TaskListView() {
  const filters = useTaskFilters()

  // Subscribe to task filters
  const { data, isLoading } = useTasks({
    status: filters.status,
    priority: filters.priority,
    search: filters.search,
    assignee: filters.assignee[0],
    sprint: filters.sprint[0],
    page: filters.page,
    pageSize: filters.pageSize,
  })

  return (
    <>
      <TaskFilterPanel />
      {/* Render tasks */}
    </>
  )
}
```

### Applying a Preset

```tsx
const filters = useTaskFilters()

// User clicks "My Tasks" preset
filters.applyPreset('my-tasks')

// URL updates to: ?assignee=current-user
// Tasks list automatically refetches with new filters
```

### Setting Individual Filters

```tsx
const filters = useTaskFilters()

// Set status filter to multiple values
filters.setFilter('status', ['backlog', 'in-progress'])

// URL updates to: ?status=backlog&status=in-progress
// Debounced query runs after 300ms

// Clear the status filter
filters.clearFilter('status')
```

### Manual Filter Updates

```tsx
const filters = useTaskFilters()

// Update multiple filters at once (still debounced)
filters.applyFilters({
  status: ['done'],
  priority: ['high', 'medium'],
  search: 'authentication',
})

// For pagination changes, use immediate mode
filters.applyFilters({ page: 2 }, true) // No debounce
```

## URL Params Format

The hook persists filter state as URL search params:

```
// Single values
?status=backlog&priority=high&search=authentication

// Multiple values (array format)
?status=backlog&status=in-progress&assignee=agent-1&assignee=agent-2

// With pagination
?status=backlog&page=2&pageSize=20
```

Empty arrays and null values are omitted from the URL to keep params clean.

## Query Key Structure

TanStack Query uses structured keys for cache management:

```typescript
// Query key includes all filter state
queryKey: ['tasks', 'list', {
  status: ['backlog', 'in-progress'],
  priority: ['high'],
  search: 'auth',
  assignee: 'agent-1',
  sprint: 'sprint-1',
  page: 2,
  pageSize: 10,
}]

// When filters change, React Query recognizes new cache entry
// Background refetch triggers automatically
```

## Cache Invalidation

On filter change, the hook automatically invalidates task queries:

```typescript
// Before navigation
const oldKey = ['tasks', 'list', { /* old filters */ }]

// User updates filter
filters.setFilter('status', ['done'])

// Hook invalidates all 'tasks' queries
queryClient.invalidateQueries({ queryKey: ['tasks'] })

// React Query refetches with new filters
// Background refetch with stale-while-revalidate
```

## Debouncing Strategy

Search updates and filter changes are debounced to avoid excessive queries:

```typescript
// Search input changes trigger debounce (default 300ms)
filters.setFilter('search', 'authentication')

// Timer starts
// If user keeps typing, timer resets
// After 300ms of inactivity, query runs

// Page changes are immediate (no debounce)
filters.setFilter('page', 2, true)
```

## Built-in Presets

### 1. My Tasks
- **Criteria**: `assignee: current-user`
- **Use Case**: Show only tasks assigned to the logged-in user

### 2. This Sprint
- **Criteria**: `sprint: current-sprint`
- **Use Case**: Focus on tasks in the active sprint

### 3. Overdue
- **Criteria**: `status: [backlog, in-progress, in-review]`
- **Use Case**: Show non-completed tasks (potential blockers)

### 4. Unassigned
- **Criteria**: `assignee: unassigned`
- **Use Case**: Find tasks that need assignment

All presets are composable—apply one preset, then apply additional filters.

## MSW Handler Details

### GET /api/tasks Filtering

The handler supports:

1. **Multi-value Parameters**:
   ```
   ?status=todo&status=in-progress&status=in-review
   ```

2. **Mixed Single/Multi Values**:
   ```
   ?status=backlog&priority=high&assignee=alice&assignee=bob
   ```

3. **Pagination**:
   ```
   ?pageIndex=0&pageSize=20
   ```

4. **Full-text Search**:
   ```
   ?search=authentication
   ```

### Filter Logic

```typescript
// Filtering pseudocode
let filtered = tasks.filter(task => {
  // Status: OR logic (any match passes)
  if (statusFilters.length > 0 && !statusFilters.includes(task.status))
    return false

  // Priority: OR logic (any match passes)
  if (priorityFilters.length > 0 && !priorityFilters.includes(task.priority))
    return false

  // Assignee: OR logic (any match passes)
  if (assigneeFilters.length > 0 && !assigneeFilters.includes(task.assignee))
    return false

  // Sprint: OR logic (any match passes)
  if (sprintFilters.length > 0 && !sprintFilters.includes(task.sprint))
    return false

  // Search: Full-text match (title contains search)
  if (searchQuery && !task.title.toLowerCase().includes(searchQuery))
    return false

  return true // All dimensions passed (AND logic)
})
```

### Response Format

```typescript
{
  data: Task[],                    // Paginated tasks
  total: number,                   // Total matching tasks (not paginated)
  page: number,                    // 1-indexed page number
  pageSize: number,                // Items per page
  totalPages: number               // Calculated from total and pageSize
}
```

## Testing Scenarios

### Scenario 1: Filter by Status
```
1. User clicks checkboxes for "backlog" and "in-progress"
2. URL updates to ?status=backlog&status=in-progress
3. Tasks list refetches with filtered results
4. Active filter tags show above list
```

### Scenario 2: Apply Preset
```
1. User selects "This Sprint" from dropdown
2. applyPreset('this-sprint') runs
3. URL updates to ?sprint=current-sprint
4. Preset dropdown closes
5. Tasks auto-update to show only sprint tasks
```

### Scenario 3: Bookmark URL
```
1. User applies filters: status=done, priority=high
2. URL is ?status=done&priority=high
3. User bookmarks page
4. Next session: user opens bookmark
5. useTaskFilters parses URL params
6. Filters are restored without manual selection
7. Tasks list shows filtered results
```

### Scenario 4: Clear Filters
```
1. User has active filters
2. Clicks "Clear All Filters" button
3. URL becomes root (no params)
4. All filter selections clear
5. Tasks list shows all tasks
```

## Performance Considerations

1. **Debouncing**: Default 300ms prevents rapid re-queries on search input
2. **Query Keys**: Structured keys enable React Query cache splitting
3. **Stale-while-revalidate**: Users see cached results while background refetch runs
4. **Multi-select**: Array values create separate cache entries (correct behavior)
5. **Pagination**: Page changes are not debounced for responsive UX

## Migration from Old Filtering

If upgrading from simple filters to advanced filters:

```typescript
// Old API
useTask Query({ filters: { status: 'backlog' } })

// New API
const filters = useTaskFilters()
useTasks({
  status: filters.status,
  priority: filters.priority,
  // ... other filters
})
```

The new API is backward compatible—single values work same as before.

## Future Enhancements

1. **Custom Presets**: Allow users to save favorite filter combinations
2. **Advanced Operators**: Support date range, custom text operators
3. **Filter History**: Remember recently applied filter combinations
4. **Preset Sharing**: Share filter URLs with team members
5. **API Aggregations**: Backend facet counts for available filter values

## Related Issues

- **FAB-149**: Bulk Operations (task list infrastructure)
- **FAB-95**: Sprint Dashboard (query patterns)
- **FAB-278**: Planning thread (feature proposal)
