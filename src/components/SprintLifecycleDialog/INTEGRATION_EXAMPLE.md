# Integration Example: Sprint Lifecycle Dialog

This document shows how to integrate the SprintLifecycleDialog into your Sprint Dashboard.

## Basic Integration

### 1. Add to Sprint Dashboard Component

```tsx
// src/routes/dashboard/sprints.tsx
import { useState } from 'react'
import { useSprints } from '@/hooks/queries/sprints'
import { SprintLifecycleDialog } from '@/components/SprintLifecycleDialog'
import type { Sprint } from '@/types/sprint'

export function SprintDashboard() {
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [isLifecycleDialogOpen, setIsLifecycleDialogOpen] = useState(false)
  const { data: response } = useSprints(1, 10, 'active')

  const activeSprints = response?.data || []

  const handleOpenLifecycleDialog = (sprint: Sprint) => {
    setSelectedSprint(sprint)
    setIsLifecycleDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Sprints Table */}
      <div className="space-y-2">
        {activeSprints.map((sprint) => (
          <div key={sprint.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">{sprint.name}</h3>
              <p className="text-sm text-gray-600">
                {sprint.completedCount}/{sprint.taskCount} tasks completed
              </p>
            </div>

            {/* Lifecycle button */}
            <button
              onClick={() => handleOpenLifecycleDialog(sprint)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Manage Lifecycle
            </button>
          </div>
        ))}
      </div>

      {/* Sprint Lifecycle Dialog */}
      <SprintLifecycleDialog
        sprint={selectedSprint}
        isOpen={isLifecycleDialogOpen}
        onClose={() => {
          setIsLifecycleDialogOpen(false)
          setSelectedSprint(null)
        }}
        onArchiveSuccess={() => {
          // Refetch active sprints after successful archive
          setIsLifecycleDialogOpen(false)
          setSelectedSprint(null)
          // queryClient.invalidateQueries({ queryKey: sprintKeys.list({ archived: false }) })
        }}
        onRestoreSuccess={() => {
          // Refetch archived sprints after successful restore
          console.log('Sprint restored successfully')
        }}
      />
    </div>
  )
}
```

### 2. Add Lifecycle Button to Sprint Cards

```tsx
// src/components/SprintCard.tsx
interface SprintCardProps {
  sprint: Sprint
  onManageLifecycle: (sprint: Sprint) => void
}

export function SprintCard({ sprint, onManageLifecycle }: SprintCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{sprint.name}</h3>
          <p className="text-sm text-gray-500">{sprint.id}</p>
        </div>

        {/* Status badge and lifecycle button */}
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {sprint.status}
          </span>

          <button
            onClick={() => onManageLifecycle(sprint)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Manage sprint lifecycle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sprint metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Tasks</p>
          <p className="text-lg font-semibold">
            {sprint.completedCount}/{sprint.taskCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide">Points</p>
          <p className="text-lg font-semibold">{sprint.estimatedPoints}</p>
        </div>
      </div>

      {/* Completion progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600"
          style={{
            width: `${sprint.taskCount ? (sprint.completedCount / sprint.taskCount) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  )
}
```

## Advanced Usage

### 1. With Query Client Invalidation

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { sprintKeys } from '@/hooks/queries/sprints'

export function SprintDashboard() {
  const queryClient = useQueryClient()

  const handleArchiveSuccess = () => {
    // Refetch active and archived sprints lists
    queryClient.invalidateQueries({ queryKey: sprintKeys.lists() })
    queryClient.invalidateQueries({ queryKey: sprintKeys.list({ archived: false }) })
    queryClient.invalidateQueries({ queryKey: sprintKeys.list({ archived: true }) })

    // Optionally show toast notification
    // showNotification('Sprint archived successfully', 'success')
  }

  return (
    <SprintLifecycleDialog
      sprint={selectedSprint}
      isOpen={isLifecycleDialogOpen}
      onClose={() => setIsLifecycleDialogOpen(false)}
      onArchiveSuccess={handleArchiveSuccess}
      onRestoreSuccess={handleArchiveSuccess}
    />
  )
}
```

### 2. With Notifications

```tsx
import { useNotificationStore } from '@/stores/notifications'

export function SprintDashboard() {
  const addNotification = useNotificationStore((state) => state.add)

  const handleArchiveSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Sprint Archived',
      message: 'The sprint has been archived successfully.',
    })
  }

  const handleRestoreSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Sprint Restored',
      message: 'The sprint has been restored to its previous state.',
    })
  }

  return (
    <SprintLifecycleDialog
      sprint={selectedSprint}
      isOpen={isLifecycleDialogOpen}
      onClose={() => setIsLifecycleDialogOpen(false)}
      onArchiveSuccess={handleArchiveSuccess}
      onRestoreSuccess={handleRestoreSuccess}
    />
  )
}
```

### 3. With Router Integration

```tsx
import { useNavigate, useSearch } from '@tanstack/react-router'

export function SprintDashboard() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/sprints' })

  const isLifecycleDialogOpen = search.lifecycleDialogOpen === 'true'
  const selectedSprintId = search.selectedSprintId

  const handleOpenLifecycleDialog = (sprint: Sprint) => {
    navigate({
      search: {
        ...search,
        lifecycleDialogOpen: 'true',
        selectedSprintId: sprint.id,
      },
    })
  }

  const handleCloseLifecycleDialog = () => {
    navigate({
      search: {
        ...search,
        lifecycleDialogOpen: undefined,
        selectedSprintId: undefined,
      },
    })
  }

  return (
    <SprintLifecycleDialog
      sprint={selectedSprint}
      isOpen={isLifecycleDialogOpen}
      onClose={handleCloseLifecycleDialog}
      onArchiveSuccess={handleCloseLifecycleDialog}
      onRestoreSuccess={handleCloseLifecycleDialog}
    />
  )
}
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { SprintLifecycleDialog } from '@/components/SprintLifecycleDialog'
import { createQueryClient } from '@/test/utils'

describe('SprintLifecycleDialog', () => {
  it('should archive a completed sprint', async () => {
    const mockSprint = {
      id: 'sprint-1',
      name: 'Sprint 1',
      status: 'completed',
      taskCount: 5,
      completedCount: 5,
      // ... other fields
    }

    const onArchiveSuccess = jest.fn()

    const { rerender } = render(
      <QueryClientProvider client={createQueryClient()}>
        <SprintLifecycleDialog
          sprint={mockSprint}
          isOpen={true}
          onClose={() => {}}
          onArchiveSuccess={onArchiveSuccess}
        />
      </QueryClientProvider>
    )

    // Click "Proceed to Archive"
    fireEvent.click(screen.getByText('Proceed to Archive'))

    // Click confirm archive
    fireEvent.click(screen.getByText('Archive Sprint'))

    // Wait for mutation
    await waitFor(() => {
      expect(onArchiveSuccess).toHaveBeenCalled()
    })
  })

  it('should restore an archived sprint', async () => {
    const onRestoreSuccess = jest.fn()

    render(
      <QueryClientProvider client={createQueryClient()}>
        <SprintLifecycleDialog
          sprint={mockSprint}
          isOpen={true}
          onClose={() => {}}
          onRestoreSuccess={onRestoreSuccess}
        />
      </QueryClientProvider>
    )

    // Switch to Archived Sprints tab
    fireEvent.click(screen.getByText('Archived Sprints'))

    // Click Restore Sprint
    fireEvent.click(screen.getByText('Restore Sprint'))

    // Wait for mutation
    await waitFor(() => {
      expect(onRestoreSuccess).toHaveBeenCalled()
    })
  })

  it('should close on Escape key', () => {
    const onClose = jest.fn()

    render(
      <QueryClientProvider client={createQueryClient()}>
        <SprintLifecycleDialog
          sprint={mockSprint}
          isOpen={true}
          onClose={onClose}
        />
      </QueryClientProvider>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })
})
```

## Accessibility Checklist

- ✅ Dialog has proper ARIA attributes (role="dialog", aria-modal="true")
- ✅ Close button is keyboard accessible
- ✅ Escape key closes the dialog
- ✅ Tab navigation works within the dialog
- ✅ Loading states are announced
- ✅ Error messages are readable by screen readers
- ✅ Color is not the only way to indicate status

## Performance Tips

1. **Lazy load history**: Only fetch history when History tab is clicked
2. **Pagination for archived**: Use pagination for large archived sprint lists
3. **Debounce filters**: If adding search to archived sprints list
4. **Memoize components**: Use React.memo for sub-components if re-rendering frequently

## Next Steps

1. Add to your Sprint Dashboard route
2. Add notifications/toast on archive/restore
3. Add tests for archive/restore flows
4. Update documentation
5. Get code review
6. Deploy to production
