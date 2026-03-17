# Advanced Task Filtering & Search Implementation Guide

## Overview

This guide documents the implementation of Issue #328: Advanced Task Filtering & Search with multi-select filters, URL state persistence, and filter preset management.

## Features Implemented

### 1. **Search Input (Debounced)**
- Debounced search across task name, description, and assignee (300ms default)
- Controlled via `useTaskSearchFilters()` hook
- URL-synchronized through TanStack Router

### 2. **Multi-Select Filters**
All filters now support multi-select:
- **Status** - Multiple task status values (backlog, in-progress, in-review, done)
- **Priority** - Multiple priority levels (low, medium, high)
- **Agent** - Multiple assignee selections
- **Sprint** - Multiple sprint selections
- **Date Range** - Deadline start and end dates

### 3. **Real-Time Result Count**
- Displays number of matching tasks based on current filters
- Updates as filters change without page reload
- Shows loading state during fetch

### 4. **Filter Presets**
- Save current filter configuration as named presets
- Load previously saved presets with one click
- Delete presets with confirmation
- Persisted to localStorage
- Shows creation date for each preset

### 5. **Clear All Filters**
- One-click reset of all active filters
- Returns to initial empty state
- Only visible when filters are active

### 6. **URL State Synchronization**
- All filters synced to URL search params
- Shareable filter links - copy URL to share filtered results
- Browser back/forward navigation supported
- Powered by TanStack Router

## Architecture

### Component Structure

```
TaskSearchPanel (Main filtering UI)
├── FilterPresetManager (Save/load/delete presets)
├── Multi-select checkbox groups (Status, Priority, Agent, Sprint)
└── Date range inputs (Deadline From/To)

useTaskSearchFilters (State management)
├── Reads URL params via useSearch()
├── Syncs to URL via useNavigate()
├── Manages individual and multi-select filter setters
└── Tracks hasActiveFilters boolean

useTaskSearch (Data fetching)
├── Debounced query input (300ms)
├── TanStack Query integration
├── MSW API integration
└── Pagination and facet aggregation
```

### Data Flow

```
User Input
    ↓
TaskSearchPanel / useTaskSearchFilters
    ↓
URL Search Params (TanStack Router)
    ↓
useTaskSearch (builds API query)
    ↓
/api/tasks/search (MSW handler)
    ↓
Results + Facets
```

## API Integration

### Endpoint: `/api/tasks/search`

**Query Parameters:**
```
GET /api/tasks/search?q=search&status=todo,in-progress&agents=John%20Doe&priority=high&sprints=sprint-1&deadlineFrom=2024-01-01&deadlineTo=2024-12-31&page=1&perPage=20
```

**Parameters:**
- `q` - Full-text search string (optional)
- `status` - Comma-separated status values (optional, multi-select)
- `priority` - Comma-separated priority values (optional, multi-select)
- `agents` - Comma-separated agent names (optional, multi-select)
- `sprints` - Comma-separated sprint IDs (optional, multi-select)
- `deadlineFrom` - Start date for deadline range (optional, ISO 8601)
- `deadlineTo` - End date for deadline range (optional, ISO 8601)
- `page` - Page number (default: 1)
- `perPage` - Results per page (default: 20)

**Response:**
```typescript
{
  results: SearchTask[],
  facets: SearchFacets,
  pagination: TaskSearchPagination
}
```

## Usage Examples

### Multi-Select Status Filters

```typescript
const filters = useTaskSearchFilters()

// Set multiple status values
filters.setStatus(['todo', 'in-progress'])

// Get current statuses
console.log(filters.status) // ['todo', 'in-progress']

// Clear status filter
filters.setStatus([])
```

### Multi-Select Agent Filters

```typescript
const filters = useTaskSearchFilters()

// Set multiple agents
filters.setAssignees(['John Doe', 'Jane Smith'])

// Get current agents
console.log(filters.agents) // ['John Doe', 'Jane Smith']
```

### Filter Presets

```typescript
import { FilterPresetManager } from '@/components/TaskSearch'

export function FilterSection() {
  const [filters, setFilters] = useState<TaskSearchFilters>({})

  const handleLoadPreset = (presetFilters: TaskSearchFilters) => {
    setFilters(presetFilters)
    // Update other state as needed
  }

  return (
    <FilterPresetManager
      currentFilters={filters}
      onLoadPreset={handleLoadPreset}
    />
  )
}
```

### URL State Synchronization

```typescript
// URL: /tasks?status=todo,in-progress&agents=John%20Doe&priority=high&page=1

const filters = useTaskSearchFilters()

// All values automatically synced from URL
console.log(filters.status)    // ['todo', 'in-progress']
console.log(filters.agents)    // ['John Doe']
console.log(filters.priority)  // 'high'
console.log(filters.page)      // 1

// Updating filters automatically updates URL
filters.setStatus(['todo'])    // URL becomes ?status=todo&agents=...&priority=...
```

## Hook Reference

### `useTaskSearchFilters()`

Returns filter state and setter functions:

```typescript
interface UseTaskSearchFiltersReturn {
  // Current filter values
  q: string                           // Search query
  status: string[]                    // Selected statuses
  agents: string[]                    // Selected agents (multi-select)
  priority?: string                   // Selected priority
  sprints: string[]                   // Selected sprints (multi-select)
  dateFrom?: string                   // Deadline start date
  dateTo?: string                     // Deadline end date

  // Single select setters
  setQuery: (q: string) => void
  setPriority: (priority: string | null) => void
  setAssigneeId: (id: string | null) => void
  setSprintId: (id: string | null) => void

  // Multi-select setters
  setStatus: (status: string[]) => void
  setAssignees: (ids: string[]) => void    // Multi-select agents
  setPriorities: (priorities: string[]) => void
  setSprints: (ids: string[]) => void      // Multi-select sprints

  // Date range
  setDateRange: (from: string | null, to: string | null) => void

  // Pagination & Sorting
  page: number
  limit: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSorting: (field: string, direction: 'asc' | 'desc') => void

  // Utilities
  reset: () => void
  hasActiveFilters: boolean
}
```

## Component Reference

### `<TaskSearchPanel />`

Main filtering panel component:

```typescript
interface TaskSearchPanelProps {
  filters: TaskSearchFilters              // Current filter values
  onFiltersChange: (filters: TaskSearchFilters) => void
  facets: SearchFacets                    // Aggregated counts per filter
  resultCount: number                     // Number of matching results
  isLoading?: boolean                     // Show loading state
}
```

**Features:**
- Multi-select checkboxes for status, priority, agents, sprints
- Date range inputs for deadline filtering
- Real-time result count display
- Clear all filters button
- Integrated filter preset manager
- Responsive grid layout

### `<FilterPresetManager />`

Filter preset management component:

```typescript
interface FilterPresetManagerProps {
  currentFilters: TaskSearchFilters
  onLoadPreset: (filters: TaskSearchFilters) => void
}
```

**Features:**
- Save current filters as named preset
- Load previously saved presets
- Delete presets with confirmation
- Show preset creation date
- Prevent duplicate preset names
- localStorage persistence

## Storage Format

### Filter Presets (localStorage)

```typescript
// Key: 'taskFilterPresets'
[
  {
    id: 'preset_1234567890_abc123def',
    name: 'High Priority To-Do',
    filters: {
      status: ['todo'],
      priority: 'high'
    },
    createdAt: '2024-03-17T10:30:00Z'
  },
  {
    id: 'preset_1234567890_xyz789',
    name: 'Sprint 1 In Progress',
    filters: {
      sprint: ['sprint-1'],
      status: ['in-progress'],
      assignedAgent: ['John Doe', 'Jane Smith']
    },
    createdAt: '2024-03-17T09:15:00Z'
  }
]
```

## MSW Handler

The MSW handler for `/api/tasks/search` supports:

- **Full-text search** across task titles and descriptions
- **Multi-select filtering** with comma-separated values
- **Date range filtering** for task deadlines
- **Facet aggregation** with count per filter value
- **Pagination** with metadata
- **Match highlighting** showing which fields matched the search

### Handler Implementation

Location: `src/mocks/handlers/task-search.ts`

Key features:
- Parses comma-separated filter values
- Filters tasks based on all criteria
- Calculates facet counts on filtered results
- Supports pagination with configurable per-page
- Matches title/description for search queries

## Acceptance Criteria Verification

- [x] Search input: filters across task name, description, assignee (debounced, 300ms)
- [x] Multi-select filter fields:
  - [x] Agent (multi-select)
  - [x] Sprint (multi-select)
  - [x] Status (multi-select)
  - [x] Priority (multi-select)
  - [x] Date range (start date / end date)
- [x] 'Save filter preset' feature — persisted in localStorage, named by user
- [x] 'Clear all filters' button resets all fields
- [x] Real-time result count shown below filter panel
- [x] Filter state synced to URL via TanStack Router search params (shareable link)
- [x] MSW handler: GET `/api/tasks/search` with query params matching filter fields, returns paginated mock results
- [x] Client-side filtering as primary strategy; MSW handler simulates API for architecture parity

## Files Created/Updated

### New Components
- `src/components/TaskSearch/TaskSearchPanel.tsx` - Main filter UI component
- `src/components/TaskSearch/FilterPresetManager.tsx` - Filter preset management

### Enhanced Hooks
- `src/hooks/useTaskSearchFilters.ts` - Added multi-select agent/sprint support
- `src/mocks/handlers/task-search.ts` - Enhanced MSW handler for multi-select

### Documentation
- `src/docs/advanced-task-filtering-implementation.md` - This implementation guide

### Exports
- `src/components/TaskSearch/index.ts` - Updated with new component exports

## Performance Considerations

1. **Debounced Search** - 300ms debounce reduces API calls during typing
2. **Stale-While-Revalidate** - 30s stale time with 5min GC in TanStack Query
3. **Facet Aggregation** - Calculated on filtered results only
4. **Pagination** - Default 20 per page, configurable up to 100
5. **localStorage** - Filter presets stored client-side, no API calls
