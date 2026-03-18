import { useState, useCallback } from 'react'
import { useAgents } from '../../hooks/useAgents'
import type { TaskStatus, TaskPriority } from '../../types/task'

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

export interface TaskFilterSidebarProps {
  filters: {
    status?: TaskStatus[]
    priority?: TaskPriority[]
    assignee?: string[]
  }
  onFilterChange: (filterKey: 'status' | 'priority' | 'assignee', value: TaskStatus[] | TaskPriority[] | string[]) => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function TaskFilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: TaskFilterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: agents = [] } = useAgents()

  // Priority filter handlers
  const handlePriorityChange = useCallback(
    (priority: TaskPriority) => {
      const currentPriorities = filters.priority || []
      const newPriorities = currentPriorities.includes(priority)
        ? currentPriorities.filter((p) => p !== priority)
        : [...currentPriorities, priority]
      onFilterChange('priority', newPriorities)
    },
    [filters.priority, onFilterChange]
  )

  // Status filter handlers
  const handleStatusChange = useCallback(
    (status: TaskStatus) => {
      const currentStatuses = filters.status || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status]
      onFilterChange('status', newStatuses)
    },
    [filters.status, onFilterChange]
  )

  // Assignee filter handler
  const handleAssigneeChange = useCallback(
    (assigneeId: string) => {
      onFilterChange('assignee', [assigneeId])
    },
    [onFilterChange]
  )

  const handleClearAssignee = useCallback(() => {
    onFilterChange('assignee', [])
  }, [onFilterChange])

  return (
    <div
      className={`border border-slate-700 rounded-lg bg-slate-900 transition-all ${
        isCollapsed ? 'max-w-16' : 'max-w-xs w-64'
      }`}
      aria-label="Task filter sidebar"
    >
      {/* Header with Toggle */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && <h3 className="font-semibold text-white text-sm">Filters</h3>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
          aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-4 p-4">
          {/* Active Filters Badge */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Active Filters</span>
              <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium border border-blue-500/30">
                {activeFilterCount}
              </span>
            </div>
          )}

          {/* Agent Filter */}
          <div className="space-y-2">
            <label htmlFor="agent-select" className="block text-sm font-medium text-slate-300">
              Agent
            </label>
            <select
              id="agent-select"
              value={filters.assignee?.[0] || ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleAssigneeChange(e.target.value)
                } else {
                  handleClearAssignee()
                }
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <fieldset>
              <legend className="text-sm font-medium text-slate-300 block mb-2">Priority</legend>
              <div className="space-y-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priority?.includes(option.value) || false}
                      onChange={() => handlePriorityChange(option.value)}
                      className="w-4 h-4 rounded border-slate-600 cursor-pointer"
                      aria-label={`Filter by ${option.label} priority`}
                    />
                    <span className="text-sm text-slate-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <fieldset>
              <legend className="text-sm font-medium text-slate-300 block mb-2">Status</legend>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(option.value) || false}
                      onChange={() => handleStatusChange(option.value)}
                      className="w-4 h-4 rounded border-slate-600 cursor-pointer"
                      aria-label={`Filter by ${option.label} status`}
                    />
                    <span className="text-sm text-slate-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="w-full mt-4 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded text-sm text-slate-300 hover:text-white transition-colors font-medium"
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
