# Sprint Lifecycle Dialog (FAB-168)

A comprehensive tabbed modal for managing sprint state transitions — archiving completed sprints, viewing sprint history/timeline, and restoring accidentally archived sprints.

## Component Architecture

### SprintLifecycleDialog
Main container component that manages tab state and coordinates between sub-components:
- **Props**: `sprint`, `isOpen`, `onClose`, `onArchiveSuccess`, `onRestoreSuccess`
- **Tabs**: Archive | Archived Sprints | History Timeline
- **Accessibility**: ARIA roles, Escape key handling, backdrop click handling

### SprintArchivePanel
Two-stage archive workflow with confirmation summary:
1. **Initial view**: Sprint overview with completion metrics and archive button
2. **Confirmation view**: Final metrics summary with warning before archiving
- Shows: completion rate, tasks completed, estimated points, sprint duration
- Only allows archiving sprints with `completed` status
- Handles optimistic updates with rollback on error

### ArchivedSprintsList
Filterable list of all archived sprints:
- Paginated list with expandable details
- Shows completion rate, created date, start/end dates
- Restore button restores to `completed` status
- Empty state when no sprints are archived

### SprintHistoryTimeline
Chronological timeline of sprint state change events:
- Events: created, started, completed, archived, restored
- Shows previous → new status transitions
- Emoji indicators for quick visual scanning
- Color-coded badges for event type
- Sorted reverse chronologically (newest first)

## Query & Mutation Hooks

### Queries
- **useSprintHistory()**: Fetches sprint lifecycle events
  - Query key: `['sprints', 'history', sprintId]`
  - Endpoint: `GET /api/sprints/:id/history`
  - Returns: `SprintHistoryEvent[]`

- **useSprints()**: Existing hook reused for fetching archived sprints
  - Supports `status` filter parameter: `useSprints(1, 100, 'archived')`

### Mutations
- **useArchiveSprint()**: Changes sprint status to `archived`
  - Endpoint: `PATCH /api/sprints/:id` with `{ status: 'archived' }`
  - Optimistic updates: immediately updates UI
  - Rollback: restores previous state on error
  - Invalidates: sprint detail, sprint lists (active + archived)

- **useRestoreSprint()**: Changes sprint status back from `archived`
  - Endpoint: `PATCH /api/sprints/:id` with `{ status: restoreStatus }`
  - Defaults to `completed` status
  - Same optimistic update + rollback pattern

## Data Types

### SprintStatus
```typescript
type SprintStatus = 'planning' | 'active' | 'completed' | 'archived'
```

### SprintHistoryEvent
```typescript
interface SprintHistoryEvent {
  id: string
  sprintId: string
  eventType: 'created' | 'started' | 'completed' | 'archived' | 'restored'
  previousStatus?: SprintStatus
  newStatus: SprintStatus
  timestamp: string
  description: string
}
```

## API Integration

### MSW Handlers (Mock)
- `GET /api/sprints?status=archived` — Filter archived sprints
- `GET /api/sprints/:id/history` — Fetch sprint history events
- `PATCH /api/sprints/:id` — Update sprint status (existing, reused)

### Real API (Not Required for FAB-168)
Same endpoints, with persistent database storage.

## Usage Example

```tsx
import { useState } from 'react'
import { SprintLifecycleDialog } from '@/components/SprintLifecycleDialog'
import type { Sprint } from '@/types/sprint'

export function SprintManagement() {
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenDialog = (sprint: Sprint) => {
    setSelectedSprint(sprint)
    setIsDialogOpen(true)
  }

  return (
    <>
      {/* Sprints list or table */}
      <button onClick={() => handleOpenDialog(sprint)}>
        Manage Lifecycle
      </button>

      <SprintLifecycleDialog
        sprint={selectedSprint}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedSprint(null)
        }}
        onArchiveSuccess={() => {
          console.log('Sprint archived successfully')
          // Refetch sprints list if needed
        }}
        onRestoreSuccess={() => {
          console.log('Sprint restored successfully')
        }}
      />
    </>
  )
}
```

## Accessibility Features

- ✅ ARIA roles: `role="dialog"` and `aria-modal="true"`
- ✅ Keyboard navigation: Escape key closes dialog
- ✅ Focus management: Close button and action buttons are keyboard accessible
- ✅ Semantic HTML: Proper heading hierarchy and button semantics
- ✅ Color contrast: All text meets WCAG AA standards
- ✅ Loading states: Spinner with aria-busy indication

## Error Handling

- **Archive/Restore failures**: Display error message with rollback
- **History fetch failures**: Show spinner with loading state
- **Empty states**: Helpful messages when no data available
- **Disabled states**: Buttons disabled during mutations or when conditions not met

## Design Patterns

### Optimistic Updates
Following the pattern from useTaskAssignment and other mutation hooks:
1. Cancel outgoing refetches for relevant queries
2. Snapshot previous state
3. Immediately update cache with new state
4. On success: invalidate queries to refetch fresh data
5. On error: restore previous snapshot

### Query Key Structure
Follows TanStack Query best practices:
- `['sprints', 'list', { archived: false }]` — active sprints
- `['sprints', 'list', { archived: true }]` — archived sprints
- `['sprints', 'history', sprintId]` — sprint history

### Tab Management
State-based tab switching without routing:
- Keeps UI local to dialog
- Allows smooth transitions between tabs
- Automatically switches to archived tab after successful archive

## Testing Considerations

### Query/Mutation Tests
- Test optimistic updates work correctly
- Test rollback on error
- Test cache invalidation
- Test error state rendering

### Component Tests
- Test all tabs render correctly
- Test archive confirmation flow
- Test restore functionality
- Test history timeline rendering
- Test keyboard navigation (Escape key)

### MSW Mocking
- Mock GET /api/sprints with `archived` filter
- Mock GET /api/sprints/:id/history
- Mock PATCH /api/sprints/:id with status changes

## Performance Notes

- Sprints list query uses pagination (pageSize=100 for archived)
- History query has 5-minute stale time (not frequently changing)
- Optimistic updates provide instant UI feedback
- Debounced refetches prevent excessive API calls

## Future Enhancements

- Batch restore multiple archived sprints
- Search/filter within archived sprints list
- Export archive history as PDF/CSV
- Archive retention policy (auto-delete after N days)
- Archive reason/notes when archiving
