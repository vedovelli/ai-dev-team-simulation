import type { NotificationEventType } from '../../types/notification'

export type NotificationDrawerFilter = 'all' | NotificationEventType

interface NotificationDrawerFiltersProps {
  selectedFilter: NotificationDrawerFilter
  onFilterChange: (filter: NotificationDrawerFilter) => void
}

/**
 * Simplified filter controls for NotificationDrawer
 *
 * Features:
 * - Filter by notification type
 * - Responsive design with horizontal scroll on mobile
 */
export function NotificationDrawerFilters({
  selectedFilter,
  onFilterChange,
}: NotificationDrawerFiltersProps) {
  const filterOptions: { label: string; value: NotificationDrawerFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Assignments', value: 'assignment_changed' },
    { label: 'Sprints', value: 'sprint_updated' },
    { label: 'Tasks', value: 'task_reassigned' },
    { label: 'Deadlines', value: 'deadline_approaching' },
  ]

  return (
    <div className="border-b border-gray-200 px-4 py-3 flex gap-2 overflow-x-auto">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            selectedFilter === option.value
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
