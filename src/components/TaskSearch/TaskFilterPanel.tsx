import { useState, useCallback } from 'react'
import type { TaskSearchFilters } from '../../types/task-search'

interface TaskFilterPanelProps {
  filters: TaskSearchFilters
  onFiltersChange: (filters: TaskSearchFilters) => void
  facets?: {
    priority: Record<string, number>
    status: Record<string, number>
    assignedAgent: Record<string, number>
    sprint: Record<string, number>
  }
}

/**
 * Collapsible filter sidebar with status, agent, sprint, priority, and date range controls
 */
export function TaskFilterPanel({
  filters,
  onFiltersChange,
  facets = {
    priority: { low: 0, medium: 0, high: 0 },
    status: { backlog: 0, 'in-progress': 0, 'in-review': 0, done: 0 },
    assignedAgent: {},
    sprint: {},
  },
}: TaskFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleFilterChange = useCallback(
    (key: keyof TaskSearchFilters, value: string | undefined) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      })
    },
    [filters, onFiltersChange]
  )

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange('deadlineFrom', e.target.value || undefined)
    },
    [handleFilterChange]
  )

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilterChange('deadlineTo', e.target.value || undefined)
    },
    [handleFilterChange]
  )

  return (
    <div className="border-r border-slate-700">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          aria-label={isOpen ? 'Collapse filters' : 'Expand filters'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </div>

      {/* Filter controls */}
      {isOpen && (
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                handleFilterChange('status', e.target.value || undefined)
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {Object.entries(facets.status).map(([status, count]) => (
                <option key={status} value={status}>
                  {status} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
              Priority
            </label>
            <select
              value={filters.priority || ''}
              onChange={(e) =>
                handleFilterChange('priority', e.target.value || undefined)
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              {Object.entries(facets.priority).map(([priority, count]) => (
                <option key={priority} value={priority}>
                  {priority} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
              Agent
            </label>
            <select
              value={filters.assignedAgent || ''}
              onChange={(e) =>
                handleFilterChange(
                  'assignedAgent',
                  e.target.value || undefined
                )
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              aria-label="Filter by agent"
            >
              <option value="">All Agents</option>
              {Object.entries(facets.assignedAgent).map(([agent, count]) => (
                <option key={agent} value={agent}>
                  {agent} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Sprint Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
              Sprint
            </label>
            <select
              value={filters.sprint || ''}
              onChange={(e) =>
                handleFilterChange('sprint', e.target.value || undefined)
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              aria-label="Filter by sprint"
            >
              <option value="">All Sprints</option>
              {Object.entries(facets.sprint).map(([sprint, count]) => (
                <option key={sprint} value={sprint}>
                  {sprint} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
              Deadline
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.deadlineFrom || ''}
                onChange={handleDateFromChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                aria-label="Filter from deadline date"
              />
              <input
                type="date"
                value={filters.deadlineTo || ''}
                onChange={handleDateToChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                aria-label="Filter to deadline date"
              />
            </div>
          </div>

          {/* Clear All Button */}
          <button
            onClick={() => onFiltersChange({})}
            className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}
