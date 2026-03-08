# Bulk Task Operations Guide

This guide covers the task bulk operations feature, which allows users to select multiple tasks and perform batch actions (change status, reassign, set priority) with optimistic updates and partial failure handling.

## Overview

The bulk operations feature enables efficient task management by allowing users to:

- **Select multiple tasks** via checkboxes in the task table
- **Perform batch updates** on selected tasks (status, assignee, priority)
- **Preview changes** before confirming via confirmation dialog
- **Handle partial failures** gracefully (some tasks succeed, some fail)
- **Clear selection** after successful updates

## Architecture

### Components

**SprintTaskTable** (`src/components/SprintTaskTable.tsx`)
- Enhanced with multi-select checkboxes
- Props:
  - `enableBulkSelect`: boolean to enable/disable selection UI
  - `selectedTaskIds`: Set<string> of selected task IDs
  - `onSelectionChange`: callback when selection changes
- Features:
  - Select/deselect individual tasks
  - Select all visible (filtered) tasks with header checkbox
  - Visual feedback for selected rows (background highlight)

**BulkActionToolbar** (`src/components/BulkActionToolbar.tsx`)
- Floating form for bulk update operations
- Fields:
  - Status (dropdown): backlog, in-progress, in-review, done
  - Assignee (dropdown): agent selection
  - Priority (dropdown): low, medium, high
- Features:
  - "No change" option for each field (only update what's specified)
  - Real-time form state management with TanStack Form
  - Shows error messages from API
  - Disabled submit button until at least one field is changed
  - Confirmation dialog before submission

**BulkOperationConfirmDialog** (`src/components/BulkOperationConfirmDialog.tsx`)
- Confirmation modal for destructive operations
- Shows task count being updated
- Warning about bulk updates
- Escape key to close (when not pending)
- Pending state during mutation

### Hooks

**useBulkUpdateTasks** (`src/hooks/mutations/useBulkUpdateTasks.ts`)
- Mutation hook for bulk task updates
- Optimistic updates strategy:
  - Updates individual task caches (`['task', taskId]`)
  - Updates task list caches (`['tasks', ...]`, `['sprint', sprintId, 'tasks']`)
  - Automatic rollback on error
- Query invalidation:
  - Invalidates `['tasks']` queries
  - Invalidates `['sprint']` queries
  - Invalidates `['task']` queries
- Error handling:
  - Automatic retry via `useMutationWithRetry` (3 attempts with exponential backoff)
  - Rollback on final failure
- Return value:
  - `mutate`: Call mutation with taskIds and updates
  - `isPending`: Loading state
  - `error`: Error object if request failed
  - `data`: Last successful response

### API Integration

**MSW Handler** (`src/mocks/handlers/bulk-operations.ts`)

Endpoint: `PATCH /api/tasks/bulk`

Request payload:
```json
{
  "taskIds": ["task-1", "task-2", "task-3"],
  "updates": {
    "status": "done",
    "assignee": "agent-2",
    "priority": "high"
  }
}
```

Response format:
```json
{
  "success": true,
  "results": [
    {
      "taskId": "task-1",
      "success": true,
      "task": { /* full Task object */ }
    },
    {
      "taskId": "task-2",
      "success": false,
      "error": "Failed to update task. Please try again."
    }
  ],
  "successCount": 2,
  "failureCount": 1
}
```

Features:
- 10% chance of partial failure for realistic testing
- Returns detailed per-task results
- Mock tasks with updated fields applied
- Proper success/failure tracking

## Integration Example

```tsx
import { useState, useCallback } from 'react'
import { SprintTaskTable } from './components/SprintTaskTable'
import { BulkActionToolbar } from './components/BulkActionToolbar'

export function SprintTasksManager({ tasks, sprintId }) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedTaskIds(newSelection)
  }, [])

  const handleBulkComplete = useCallback(() => {
    // Clear selection after successful update
    setSelectedTaskIds(new Set())
    // Optional: show success toast
    // Optional: refetch tasks if needed
  }, [])

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
      <SprintTaskTable
        tasks={tasks}
        isLoading={false}
        enableBulkSelect={true}
        selectedTaskIds={selectedTaskIds}
        onSelectionChange={handleSelectionChange}
      />
      {selectedTaskIds.size > 0 && (
        <BulkActionToolbar
          selectedTaskIds={selectedTaskIds}
          onComplete={handleBulkComplete}
          onCancel={() => setSelectedTaskIds(new Set())}
        />
      )}
    </div>
  )
}
```

## User Flow

1. **View tasks** in SprintTaskTable with bulk select enabled
2. **Select tasks** by clicking checkboxes (individual or select-all)
3. **Open bulk form** (BulkActionToolbar automatically shows when tasks selected)
4. **Choose updates** for status, assignee, and/or priority
5. **Click Update** button
6. **Confirm dialog** appears with warning and task count
7. **Click Confirm** to proceed
8. **Optimistic updates** applied immediately to UI
9. **API request** sent to `/api/tasks/bulk`
10. **Response handling**:
    - If all succeed: close dialog, clear selection, show success message
    - If partial failure: show error message with failed task list
    - If all fail: show error, allow retry

## Error Handling

### Partial Failure
When some tasks succeed and some fail:
```tsx
{
  success: false,
  successCount: 8,
  failureCount: 2,
  results: [
    // successful updates...
    { taskId: "task-1", success: true, task: {...} },
    // failed updates...
    { taskId: "task-9", success: false, error: "..." }
  ]
}
```

The form stays open allowing users to:
- See which tasks failed
- Retry with adjusted selection
- Cancel and try different updates

### Network Failure
With `useMutationWithRetry`:
- Automatic retry up to 3 times
- Exponential backoff between retries
- Optimistic updates rolled back on final failure
- Error message shown in form

## Edge Cases

1. **Selecting all, then filtering**
   - Selection preserved across filter changes
   - Header checkbox shows "indeterminate" when partial visible tasks selected

2. **Updating tasks already at target status**
   - API handles gracefully
   - Task returned with no actual changes
   - Counts as successful

3. **Reassigning to unavailable agent**
   - MSW simulates random failures (10% chance)
   - Failed tasks shown in response
   - User can retry with different assignee

4. **Network timeout**
   - Automatic retry by hook
   - Optimistic updates maintained during retry
   - Rollback only on final failure

## Acceptance Criteria Met

- ✅ Users can select multiple tasks via checkboxes
- ✅ Bulk action form appears when tasks are selected
- ✅ Form supports status, assignee, priority updates
- ✅ Optimistic updates work correctly (immediate UI feedback)
- ✅ Error handling shows which tasks failed (via response.results array)
- ✅ MSW handler implemented with partial failure support
- ✅ Query invalidation works for all affected views
  - Individual task detail caches
  - Sprint task list caches
  - All task list caches
- ✅ Confirmation dialog for destructive operations
- ✅ Clear selection after successful update

## Testing Checklist

- [ ] Select individual tasks and verify checkbox state
- [ ] Click header checkbox to select all visible tasks
- [ ] Deselect all and verify form hides
- [ ] Change filter and verify selection persists
- [ ] Choose one update field and verify others show "No change"
- [ ] Disable submit button when no fields are changed
- [ ] Click Update and verify confirmation dialog shows
- [ ] Close dialog with Escape key
- [ ] Confirm dialog and wait for mutation
- [ ] Verify optimistic updates appear immediately
- [ ] Test partial failure (10% chance from MSW)
- [ ] Verify error message shows failed task count
- [ ] Test network error retry behavior
- [ ] Verify selection clears after success
- [ ] Verify query caches invalidate correctly

## Performance Considerations

- **Optimistic updates**: Apply immediately to 3 query key patterns for instant feedback
- **Selective invalidation**: Only invalidate affected queries, not entire cache
- **Rollback on error**: Restores previous state automatically
- **Batch API call**: Single PATCH request for all tasks vs individual updates
- **Filter selection**: Select/deselect only visible tasks, not all tasks

## Future Enhancements

- Bulk delete operation with additional confirmation
- Bulk export to CSV
- Bulk import from CSV
- Scheduled bulk operations (batch at specific time)
- Bulk operation history/audit log
- Undo/redo for bulk operations
