import { useEffect, useState, useCallback } from 'react'
import type { TaskStatus, TaskPriority } from '../types/task'

interface TaskFiltersPanelProps {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  assignee?: string
  onStatusChange: (status: TaskStatus | null) => void
  onPriorityChange: (priority: TaskPriority | null) => void
  onSearchChange: (search: string) => void
  onAssigneeChange: (assignee: string | null) => void
  onClearFilters: () => void
  assignees: string[]
  isLoading?: boolean
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

/**
 * TaskFiltersPanel component for filtering tasks with debounced search.
 * Demonstrates proper filter state management with URL persistence.
 *
 * Features:
 * - Status, priority, and assignee dropdowns
 * - Debounced text search (300ms) to reduce excessive queries
 * - Clear all filters button
 * - Active filter count badge
 * - Loading state indication
 */
export function TaskFiltersPanel({
  status,
  priority,
  search = '',
  assignee = '',
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onAssigneeChange,
  onClearFilters,
  assignees,
  isLoading = false,
}: TaskFiltersPanelProps) {
  const [localSearch, setLocalSearch] = useState(search)

  // Debounced search: update the filter only when user stops typing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, search, onSearchChange])

  const activeFilterCount = [status, priority, search, assignee].filter(
    Boolean
  ).length

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as TaskStatus | ''
      onStatusChange(value ? value : null)
    },
    [onStatusChange]
  )

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as TaskPriority | ''
      onPriorityChange(value ? value : null)
    },
    [onPriorityChange]
  )

  const handleAssigneeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      onAssigneeChange(value ? value : null)
    },
    [onAssigneeChange]
  )

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {activeFilterCount} active
            </span>
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div>
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status-filter"
          value={status || ''}
          onChange={handleStatusChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          id="priority-filter"
          value={priority || ''}
          onChange={handlePriorityChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee Filter */}
      <div>
        <label htmlFor="assignee-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Assignee
        </label>
        <select
          id="assignee-filter"
          value={assignee || ''}
          onChange={handleAssigneeChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">All Assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Search Filter with Debounce */}
      <div>
        <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Search Tasks
        </label>
        <input
          id="search-filter"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          disabled={isLoading}
          placeholder="Search by task title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          {isLoading ? 'Searching...' : 'Search updates after you stop typing (300ms debounce)'}
        </p>
      </div>
    </div>
  )
}
