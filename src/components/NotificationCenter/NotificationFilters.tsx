import type { NotificationEventType } from '../../types/notification'

export type NotificationTab = 'all' | 'unread' | 'archived'

interface NotificationFiltersProps {
  activeTab: NotificationTab
  onTabChange: (tab: NotificationTab) => void
  selectedType: NotificationEventType | 'all'
  onTypeChange: (type: NotificationEventType | 'all') => void
}

/**
 * Filter controls for NotificationCenterModal
 *
 * Features:
 * - Tab toggle: All / Unread / Archived
 * - Type filter dropdown
 * - Responsive design
 */
export function NotificationFilters({
  activeTab,
  onTabChange,
  selectedType,
  onTypeChange,
}: NotificationFiltersProps) {
  const tabs: { label: string; value: NotificationTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Archived', value: 'archived' },
  ]

  const typeOptions: { label: string; value: NotificationEventType | 'all' }[] = [
    { label: 'All Types', value: 'all' },
    { label: 'Assignment', value: 'assignment_changed' },
    { label: 'Sprint', value: 'sprint_updated' },
    { label: 'Task', value: 'task_reassigned' },
    { label: 'Deadline', value: 'deadline_approaching' },
  ]

  return (
    <div className="border-b border-gray-200 px-4 py-3 space-y-3">
      {/* Tab Toggle */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type Filter Dropdown */}
      <div>
        <label htmlFor="notification-type-filter" className="block text-xs font-medium text-gray-700 mb-1">
          Filter by type
        </label>
        <select
          id="notification-type-filter"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as NotificationEventType | 'all')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
