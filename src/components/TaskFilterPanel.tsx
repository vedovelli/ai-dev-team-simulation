/**
 * Task Filter Panel Component
 *
 * Provides a UI for advanced task filtering with:
 * - Multi-select filters for status, priority, assignee, sprint
 * - Search input with debouncing
 * - Dropdown selector for built-in filter presets
 * - Clear individual filters or all filters at once
 */

import { useState } from 'react'
import { useTaskFilters } from '../hooks/useTaskFilters'
import type { TaskStatus, TaskPriority } from '../types/task'
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/filterValidation'

export function TaskFilterPanel() {
  const filters = useTaskFilters()
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const newStatuses = checked ? [...filters.status, status] : filters.status.filter((s) => s !== status)
    filters.setFilter('status', newStatuses)
  }

  const handlePriorityChange = (priority: TaskPriority, checked: boolean) => {
    const newPriorities = checked ? [...filters.priority, priority] : filters.priority.filter((p) => p !== priority)
    filters.setFilter('priority', newPriorities)
  }

  const handleSearchChange = (value: string) => {
    filters.setFilter('search', value)
  }

  const handleAssigneeChange = (value: string) => {
    filters.setFilter('assignee', value ? [value] : [])
  }

  const handleSprintChange = (value: string) => {
    filters.setFilter('sprint', value ? [value] : [])
  }

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId)
    filters.applyPreset(presetId)
  }

  const isFiltersActive =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.search ||
    filters.assignee.length > 0 ||
    filters.sprint.length > 0

  return (
    <div className="space-y-4 p-4 bg-white border border-slate-200 rounded-lg">
      {/* Presets Dropdown */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Quick Presets</label>
        <select
          value={selectedPreset || ''}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a preset...</option>
          {filters.presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name} - {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
        <div className="space-y-2">
          {TASK_STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.status.includes(status)}
                onChange={(e) => handleStatusChange(status, e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700 capitalize">{status.replace('-', ' ')}</span>
              {filters.status.includes(status) && (
                <button
                  onClick={() => filters.clearFilter('status')}
                  className="ml-auto text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
        <div className="space-y-2">
          {TASK_PRIORITIES.map((priority) => (
            <label key={priority} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.priority.includes(priority)}
                onChange={(e) => handlePriorityChange(priority, e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700 capitalize">{priority}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Assignee Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Assignee</label>
        <select
          value={filters.assignee[0] || ''}
          onChange={(e) => handleAssigneeChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All assignees</option>
          <option value="agent-1">Agent 1</option>
          <option value="agent-2">Agent 2</option>
          <option value="agent-3">Agent 3</option>
        </select>
      </div>

      {/* Sprint Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Sprint</label>
        <select
          value={filters.sprint[0] || ''}
          onChange={(e) => handleSprintChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All sprints</option>
          <option value="sprint-1">Sprint 1</option>
          <option value="sprint-2">Sprint 2</option>
          <option value="sprint-3">Sprint 3</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {isFiltersActive && (
        <button
          onClick={() => filters.clearAllFilters()}
          className="w-full px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-sm font-medium transition"
        >
          Clear All Filters
        </button>
      )}

      {/* Active Filters Display */}
      {isFiltersActive && (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.status.map((status) => (
              <span
                key={`status-${status}`}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"
              >
                {status}
                <button
                  onClick={() => filters.clearFilter('status')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.priority.map((priority) => (
              <span
                key={`priority-${priority}`}
                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"
              >
                {priority}
                <button
                  onClick={() => filters.clearFilter('priority')}
                  className="text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.search && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                Search: {filters.search}
                <button
                  onClick={() => filters.clearFilter('search')}
                  className="text-purple-500 hover:text-purple-700"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
