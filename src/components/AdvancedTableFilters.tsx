import { useState } from 'react'
import type { TaskStatus, TaskPriority } from '../types/task'

interface AdvancedTableFiltersProps {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  team?: string
  assignee?: string
  dateFrom?: string
  dateTo?: string
  onStatusChange?: (status: TaskStatus | null) => void
  onPriorityChange?: (priority: TaskPriority | null) => void
  onSearchChange?: (search: string) => void
  onTeamChange?: (team: string) => void
  onAssigneeChange?: (assignee: string) => void
  onDateRangeChange?: (from: string | null, to: string | null) => void
  onClearFilters?: () => void
  teams?: string[]
  assignees?: string[]
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

export function AdvancedTableFilters({
  status,
  priority,
  search = '',
  team = '',
  assignee = '',
  dateFrom = '',
  dateTo = '',
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onTeamChange,
  onAssigneeChange,
  onDateRangeChange,
  onClearFilters,
  teams = [],
  assignees = [],
}: AdvancedTableFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    status: true,
    priority: true,
    search: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const activeFilterCount = [status, priority, search, team, assignee, dateFrom, dateTo].filter(
    Boolean
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {activeFilterCount} active
            </span>
            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Search */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Search</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search task titles..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="pb-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection('status')}
            className="flex items-center justify-between w-full mb-2"
          >
            <h3 className="text-sm font-semibold text-gray-700">Status</h3>
            <span className="text-gray-400">{expandedSections['status'] ? '−' : '+'}</span>
          </button>
          {expandedSections['status'] && (
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={status === option.value}
                    onChange={() =>
                      onStatusChange?.(status === option.value ? null : option.value)
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="pb-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection('priority')}
            className="flex items-center justify-between w-full mb-2"
          >
            <h3 className="text-sm font-semibold text-gray-700">Priority</h3>
            <span className="text-gray-400">{expandedSections['priority'] ? '−' : '+'}</span>
          </button>
          {expandedSections['priority'] && (
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={priority === option.value}
                    onChange={() =>
                      onPriorityChange?.(priority === option.value ? null : option.value)
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Team Filter */}
        {teams.length > 0 && (
          <div className="pb-4 border-b border-gray-200">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Team</h3>
            <select
              value={team}
              onChange={(e) => onTeamChange?.(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignee Filter */}
        {assignees.length > 0 && (
          <div className="pb-4 border-b border-gray-200">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Assignee</h3>
            <select
              value={assignee}
              onChange={(e) => onAssigneeChange?.(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All assignees</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Filter */}
        <div>
          <button
            onClick={() => toggleSection('dateRange')}
            className="flex items-center justify-between w-full mb-2"
          >
            <h3 className="text-sm font-semibold text-gray-700">Date Range</h3>
            <span className="text-gray-400">{expandedSections['dateRange'] ? '−' : '+'}</span>
          </button>
          {expandedSections['dateRange'] && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) =>
                    onDateRangeChange?.(e.target.value || null, dateTo || null)
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) =>
                    onDateRangeChange?.(dateFrom || null, e.target.value || null)
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
