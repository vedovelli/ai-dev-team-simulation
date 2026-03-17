import { useState } from 'react'
import type { TaskSearchFilters, SearchFacets } from '../../types/task-search'

interface TaskSearchFiltersProps {
  filters: TaskSearchFilters
  onFiltersChange: (filters: TaskSearchFilters) => void
  facets: SearchFacets
  onClearAll: () => void
  hasActiveFilters: boolean
  isExpanded?: boolean
}

export function TaskSearchFilters({
  filters,
  onFiltersChange,
  facets,
  onClearAll,
  hasActiveFilters,
  isExpanded = true,
}: TaskSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(isExpanded)

  const handlePriorityChange = (priority: string) => {
    onFiltersChange({
      ...filters,
      priority: filters.priority === priority ? undefined : priority,
    })
  }

  const handleStatusChange = (status: string) => {
    const currentStatuses = filters.status ? [filters.status] : []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses[0] : undefined,
    })
  }

  const handleAgentChange = (agent: string) => {
    onFiltersChange({
      ...filters,
      assignedAgent: filters.assignedAgent === agent ? undefined : agent,
    })
  }

  const handleSprintChange = (sprint: string) => {
    onFiltersChange({
      ...filters,
      sprint: filters.sprint === sprint ? undefined : sprint,
    })
  }

  const handleDeadlineFromChange = (date: string) => {
    onFiltersChange({
      ...filters,
      deadlineFrom: date || undefined,
    })
  }

  const handleDeadlineToChange = (date: string) => {
    onFiltersChange({
      ...filters,
      deadlineTo: date || undefined,
    })
  }

  return (
    <div className="border-t border-slate-700">
      {/* Filter Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-blue-300 bg-blue-900/40 rounded-full border border-blue-700">
              {Object.values(filters).filter((v) => v !== undefined).length}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

      {isOpen && (
        <div className="px-4 py-4 space-y-4 bg-slate-800/30">
          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Priority
            </label>
            <div className="space-y-1.5">
              {Object.entries(facets.priority).map(([priority, count]) => (
                <label
                  key={priority}
                  className="flex items-center gap-2.5 cursor-pointer group/item"
                >
                  <input
                    type="checkbox"
                    checked={filters.priority === priority}
                    onChange={() => handlePriorityChange(priority)}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover/item:text-slate-100 transition-colors capitalize flex-1">
                    {priority}
                  </span>
                  <span className="text-xs text-slate-500">{count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              Status
            </label>
            <div className="space-y-1.5">
              {Object.entries(facets.status).map(([status, count]) => (
                <label
                  key={status}
                  className="flex items-center gap-2.5 cursor-pointer group/item"
                >
                  <input
                    type="checkbox"
                    checked={filters.status === status}
                    onChange={() => handleStatusChange(status)}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover/item:text-slate-100 transition-colors capitalize flex-1">
                    {status.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">{count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Agent Filter */}
          {Object.keys(facets.assignedAgent).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                Agent
              </label>
              <select
                value={filters.assignedAgent || ''}
                onChange={(e) => handleAgentChange(e.target.value || '')}
                className="w-full px-2.5 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Agents</option>
                {Object.keys(facets.assignedAgent).map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sprint Filter */}
          {Object.keys(facets.sprint).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                Sprint
              </label>
              <select
                value={filters.sprint || ''}
                onChange={(e) => handleSprintChange(e.target.value || '')}
                className="w-full px-2.5 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sprints</option>
                {Object.keys(facets.sprint).map((sprint) => (
                  <option key={sprint} value={sprint}>
                    {sprint}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Deadline Date Range */}
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Deadline
            </label>
            <div>
              <label htmlFor="deadline-from" className="block text-xs text-slate-400 mb-1">
                From
              </label>
              <input
                id="deadline-from"
                type="date"
                value={filters.deadlineFrom || ''}
                onChange={(e) => handleDeadlineFromChange(e.target.value)}
                className="w-full px-2.5 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Deadline from date"
              />
            </div>
            <div>
              <label htmlFor="deadline-to" className="block text-xs text-slate-400 mb-1">
                To
              </label>
              <input
                id="deadline-to"
                type="date"
                value={filters.deadlineTo || ''}
                onChange={(e) => handleDeadlineToChange(e.target.value)}
                className="w-full px-2.5 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Deadline to date"
              />
            </div>
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-slate-700">
              <button
                onClick={onClearAll}
                className="w-full px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
