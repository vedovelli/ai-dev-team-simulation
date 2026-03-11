# SearchPanel UI Component

A clean, accessible search and filter interface for task lists. Built with React, TanStack Form, and fully integrated with the `useAdvancedTaskFilters` hook.

## Features

✨ **Core Features:**
- 🔍 **Search Input** with debounce indicator (300ms default)
- 🏷️ **Status Filter** — Multi-select checkboxes (Backlog, In Progress, In Review, Done)
- 👤 **Assignee Filter** — Dropdown to filter by agent/team member
- 🏷️ **Active Filter Chips** — Visual tags for active filters with individual removal
- 🗑️ **Clear All Button** — Reset all filters at once
- ⌨️ **Cmd+K Shortcut** — Focus search input with keyboard shortcut
- 📱 **Responsive Design** — Mobile-first layout (1 col mobile, 2 col desktop)
- ♿ **Full Accessibility** — ARIA labels, keyboard navigation, screen reader support
- 📊 **Filter Indicators** — Shows active filter count with visual badge

## Installation

The SearchPanel is part of the components package. Import it directly:

```tsx
import { SearchPanel } from '@/components/SearchPanel'
```

## Basic Usage

```tsx
import { SearchPanel } from '@/components/SearchPanel'

export function MyApp() {
  return (
    <div>
      <SearchPanel
        agents={['Alice', 'Bob', 'Charlie']}
        isLoading={false}
        debounceMs={300}
      />
    </div>
  )
}
```

## Props

### SearchPanelProps

```typescript
interface SearchPanelProps {
  /**
   * List of agent/team member names for assignee filter dropdown
   * @default ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
   */
  agents?: string[]

  /**
   * Optional callback when filters are applied
   * @default undefined
   */
  onSearchApply?: () => void

  /**
   * Show loading state in UI
   * @default false
   */
  isLoading?: boolean

  /**
   * Debounce delay in milliseconds for search input
   * @default 300
   */
  debounceMs?: number
}
```

## Integration with useAdvancedTaskFilters

The SearchPanel is designed to work seamlessly with the `useAdvancedTaskFilters` hook:

```tsx
import { useQuery } from '@tanstack/react-query'
import { SearchPanel } from '@/components/SearchPanel'
import { useAdvancedTaskFilters } from '@/hooks/useAdvancedTaskFilters'

export function TaskListPage() {
  const filters = useAdvancedTaskFilters()

  // Use filter state in your query
  const { data, isLoading } = useQuery({
    queryKey: filters.queryKey,
    queryFn: () => fetchTasks(filters.state),
    staleTime: filters.queryOptions.staleTime,
    gcTime: filters.queryOptions.gcTime,
  })

  return (
    <>
      <SearchPanel isLoading={isLoading} agents={['Alice', 'Bob', 'Charlie']} />

      {/* Render filtered tasks */}
      <TaskList tasks={data?.tasks} />
    </>
  )
}
```

## How It Works

### 1. **Form State Management**

SearchPanel uses TanStack Form with Zod validation:

```typescript
const form = useForm<SearchPanelFormData>({
  defaultValues: {
    search: '',
    status: [],
    assignee: null,
  },
  validators: {
    onChange: searchPanelSchema,
  },
})
```

### 2. **Debounced Search**

Search input is debounced (300ms default) before syncing to filters. The component shows a loading spinner while typing:

```tsx
<div className="relative">
  <input
    type="text"
    placeholder="Type to search tasks... (Cmd+K)"
  />
  {isSearching && <LoadingSpinner />}
</div>
```

### 3. **Active Filter Chips**

Filters are displayed as removable chips below the search area:

```
[Backlog] [In Progress] [Alice] [Search Query] ✕
```

Each chip can be removed individually, and the entire filter set can be cleared.

### 4. **Keyboard Shortcuts**

- **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) — Focus search input
- **Escape** — Clear search (standard browser behavior)
- **Tab** — Navigate between filters
- **Space/Enter** — Toggle checkboxes

### 5. **Responsive Layout**

```
Mobile (< 768px):
┌─────────────────────┐
│ Search & Filter     │
├─────────────────────┤
│ Search Input        │
├─────────────────────┤
│ Status Checkboxes   │
├─────────────────────┤
│ Assignee Dropdown   │
├─────────────────────┤
│ Active Chips        │
└─────────────────────┘

Desktop (≥ 768px):
┌─────────────────────────────────────┐
│ Search & Filter     [2 filters active] [Clear all] │
├─────────────────────────────────────┤
│ Search Input                        │
├────────────────────┬────────────────┤
│ Status Checkboxes  │ Assignee Dropdown │
├─────────────────────────────────────┤
│ Active Chips                        │
└─────────────────────────────────────┘
```

## Advanced Usage

### Custom Agents List

```tsx
<SearchPanel
  agents={customAgentsList.map(a => a.name)}
  isLoading={isLoadingAgents}
/>
```

### Handling Filter Changes

The SearchPanel automatically syncs with `useAdvancedTaskFilters`. You can also hook into the form state:

```tsx
const SearchPanelWrapper = () => {
  const filters = useAdvancedTaskFilters()

  const handleFilterApply = useCallback(() => {
    // Custom logic when filters change
    analytics.track('task_filters_applied', {
      searchTerm: filters.debouncedSearch,
      statuses: filters.status,
      assignee: filters.assignee,
    })
  }, [filters])

  return <SearchPanel onSearchApply={handleFilterApply} />
}
```

### Custom Debounce Timing

For slower networks or real-time backends:

```tsx
<SearchPanel
  debounceMs={500}  // Wait 500ms before searching
  isLoading={isLoading}
/>
```

## Accessibility Features

✅ **ARIA Support:**
- `aria-label` on all interactive elements
- `aria-describedby` for help text
- `aria-controls` for related elements (future enhancement)

✅ **Keyboard Navigation:**
- All controls keyboard accessible
- Tab order is logical and intuitive
- Focus management with visual indicators

✅ **Screen Reader Support:**
- Filter count announced
- Debounce status described
- Chip removal actions labeled
- Error/loading states announced

## Styling

The component uses **Tailwind CSS** for styling:

- Primary color: `blue` — Search/active filters
- Secondary color: `purple` — Assignee filter
- Neutral color: `gray` — UI chrome
- Accents: `blue-100`, `purple-50`, `gray-50` — Chip backgrounds

### Customizing Colors

To customize, extend Tailwind in your project or override classes:

```tsx
<SearchPanel className="custom-search-panel" />
```

## Complete Example

See `SearchPanelExample.tsx` for a complete working example with:
- Task list rendering
- Pagination
- Loading states
- Error handling
- Empty states

## Testing

The component is fully testable with standard React Testing Library patterns:

```tsx
import { render, screen, userEvent } from '@testing-library/react'
import { SearchPanel } from '@/components/SearchPanel'

test('filters tasks by status', async () => {
  render(<SearchPanel agents={['Alice']} />)

  // Click status checkbox
  await userEvent.click(screen.getByLabelText(/backlog/i))

  // Verify filter is active
  expect(screen.getByText(/1 filter active/i)).toBeInTheDocument()
})
```

## Performance Considerations

- **Debounced Search:** Prevents excessive API calls
- **Query Key Memoization:** `queryKey` is memoized to prevent unnecessary refetches
- **Filter Hash:** Stable filter hash for cache invalidation
- **Keep Previous Data:** Uses `keepPreviousData: true` for smooth UX

## Future Enhancements

Possible future additions (out of scope for FAB-166):
- Date range filters (due date, created date)
- Priority filter
- Custom filter save/load
- Advanced search syntax (e.g., `status:done assignee:alice`)
- Filter presets
- Search history

## Related Components

- **useAdvancedTaskFilters** — Hook for managing filter state
- **TaskFiltersPanel** — Form-based filter panel (alternative UI)
- **FilterBar** — Minimal filter bar component
- **TaskFilterPanelExample** — Alternative filtering pattern

## Troubleshooting

**Q: Keyboard shortcut (Cmd+K) not working?**
A: Ensure the window isn't focused on an input field. The shortcut is global and will focus the search input.

**Q: Filters not updating in real-time?**
A: Check that you're using the `filters.queryKey` in your `useQuery` call. The key must change for React Query to refetch.

**Q: Empty state showing when filters are active?**
A: This is expected. The message changes to "No tasks match your filters." with a clear filters button.
