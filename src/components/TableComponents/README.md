# Table Components

Refactored table components with URL-driven state management using `useTableState`. All tables support search, filtering, sorting, and pagination with full browser back/forward navigation support.

## Components

### SearchBar

Debounced search input component for filtering table data.

```tsx
import { SearchBar } from '@/components/TableComponents'

<SearchBar
  value={searchValue}
  onChange={(value) => handleSearch(value)}
  placeholder="Search tasks..."
  debounceMs={300}
  disabled={false}
/>
```

**Props:**
- `value: string` - Current search value
- `onChange: (value: string) => void` - Callback on value change
- `placeholder?: string` - Input placeholder (default: "Search...")
- `debounceMs?: number` - Debounce delay in milliseconds (default: 300)
- `disabled?: boolean` - Disable the input

### FilterControls

Multi-dimensional dropdown filter selector.

```tsx
import { FilterControls } from '@/components/TableComponents'

<FilterControls
  filters={filters}
  onFilterChange={(key, value) => handleFilter(key, value)}
  filterConfigs={[
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ]}
/>
```

**Props:**
- `filters: Record<string, string | undefined>` - Current filter values
- `onFilterChange: (key: string, value: string | undefined) => void` - Callback on filter change
- `filterConfigs: Array<{key, label, options}>` - Filter dimension configurations
- `disabled?: boolean` - Disable all filters

### Pagination

Pagination control component with page size selector.

```tsx
import { Pagination } from '@/components/TableComponents'

<Pagination
  page={currentPage}
  pageSize={itemsPerPage}
  totalItems={totalCount}
  onPageChange={(page) => setPage(page)}
  onPageSizeChange={(size) => setPageSize(size)}
/>
```

**Props:**
- `page: number` - Current page number (1-indexed)
- `pageSize: number` - Items per page
- `totalItems: number` - Total number of items
- `onPageChange: (page: number) => void` - Callback on page change
- `onPageSizeChange: (pageSize: number) => void` - Callback on page size change
- `disabled?: boolean` - Disable pagination controls

### TasksTable

Refactored tasks table with URL state integration.

```tsx
import { TasksTable } from '@/components/TableComponents'

<TasksTable
  tasks={tasks}
  isLoading={false}
/>
```

**Features:**
- Search by task title
- Filter by status (Backlog, In Progress, In Review, Done)
- Filter by priority (Low, Medium, High)
- Sort by created_at, priority, deadline
- Pagination with configurable page size
- Full URL state persistence

**Props:**
- `tasks: Task[]` - Array of tasks to display
- `isLoading?: boolean` - Loading state

### AgentsTable

Refactored agents table with URL state integration.

```tsx
import { AgentsTable } from '@/components/TableComponents'

<AgentsTable
  agents={agents}
  isLoading={false}
/>
```

**Features:**
- Search by agent name
- Filter by status (Idle, Working, Blocked, Completed)
- Sort by name, status, last updated
- Pagination with configurable page size
- Full URL state persistence

**Props:**
- `agents: Agent[]` - Array of agents to display
- `isLoading?: boolean` - Loading state

### SprintsTable

Refactored sprints table with URL state integration.

```tsx
import { SprintsTable } from '@/components/TableComponents'

<SprintsTable
  sprints={sprints}
  isLoading={false}
/>
```

**Features:**
- Search by sprint name
- Filter by status (Planning, Active, Completed)
- Sort by name, start date, completion rate
- Pagination with configurable page size
- Visual completion rate indicator
- Full URL state persistence

**Props:**
- `sprints: Sprint[]` - Array of sprints to display
- `isLoading?: boolean` - Loading state

## URL State Management

All tables use the `useTableState` hook to persist state in URL query parameters. This enables:

- **Shareable URLs**: Users can share filtered/sorted table views
- **Browser Navigation**: Back/forward buttons work correctly
- **State Persistence**: Page refreshes maintain table state
- **Bookmark Support**: Table configurations can be bookmarked

### URL Query Parameters

Tables use these URL parameters:

```
?sort=columnId:asc,columnId2:desc
?filter_status=active
?filter_priority=high
?filter_search=query
?page=2
?pageSize=20
```

## Usage Example

```tsx
import { TasksTable } from '@/components/TableComponents'
import { useTasks } from '@/hooks/queries/tasks'

export function TasksPage() {
  const { data: tasks, isLoading } = useTasks()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      <TasksTable
        tasks={tasks ?? []}
        isLoading={isLoading}
      />
    </div>
  )
}
```

## Styling

All components use Tailwind CSS with a dark theme (slate colors). They follow the existing design system:

- **Background**: `bg-slate-800` for inputs, `bg-slate-900` for headers
- **Borders**: `border-slate-700` for most elements
- **Text**: `text-slate-300` for secondary text, `text-white` for primary
- **Hover States**: `hover:bg-slate-700` for interactive elements
- **Disabled States**: `disabled:opacity-50 disabled:cursor-not-allowed`

## Accessibility

All components include proper ARIA labels and keyboard support:

- Search input: `aria-label="Search table"`
- Filter selects: `aria-label="{filter label}"`
- Pagination buttons: `aria-label="Previous page"`, `aria-label="Next page"`
- Checkboxes support `aria-label`

## Testing

Basic unit tests are included in `__tests__/`:
- `SearchBar.test.tsx` - Tests for search input debouncing and clearing
- `TasksTable.test.tsx` - Tests for table rendering and filtering

To run tests:
```bash
npm run test
```
