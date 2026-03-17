/**
 * TaskSearchPanel Component
 *
 * Advanced search and filtering panel with:
 * - Debounced search input (filters name, description, assignee)
 * - Multi-select filters (status, priority, agents, sprints)
 * - Date range filtering (deadline start/end)
 * - Real-time result count display
 * - Integration with filter preset management
 */

import { useCallback, useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import type { TaskSearchFilters, SearchFacets } from '../../types/task-search'
import { FilterPresetManager } from './FilterPresetManager'

interface TaskSearchPanelProps {
  filters: TaskSearchFilters
  onFiltersChange: (filters: TaskSearchFilters) => void
  facets: SearchFacets
  resultCount: number
  isLoading?: boolean
}

interface FilterFormValues {
  search: string
  status: string[]
  priority: string[]
  agents: string[]
  sprints: string[]
  deadlineFrom: string
  deadlineTo: string
}

function filtersToFormValues(filters: TaskSearchFilters): FilterFormValues {
  return {
    search: '',
    status: Array.isArray(filters.status) ? filters.status : filters.status ? [filters.status] : [],
    priority: Array.isArray(filters.priority) ? filters.priority : filters.priority ? [filters.priority] : [],
    agents: Array.isArray(filters.assignedAgent)
      ? filters.assignedAgent
      : filters.assignedAgent
        ? [filters.assignedAgent]
        : [],
    sprints: Array.isArray(filters.sprint) ? filters.sprint : filters.sprint ? [filters.sprint] : [],
    deadlineFrom: filters.deadlineFrom || '',
    deadlineTo: filters.deadlineTo || '',
  }
}

function formValuesToFilters(values: FilterFormValues): TaskSearchFilters {
  return {
    status: values.status.length > 0 ? values.status : undefined,
    priority: values.priority.length > 0 ? values.priority : undefined,
    assignedAgent: values.agents.length > 0 ? values.agents : undefined,
    sprint: values.sprints.length > 0 ? values.sprints : undefined,
    deadlineFrom: values.deadlineFrom || undefined,
    deadlineTo: values.deadlineTo || undefined,
  }
}

export function TaskSearchPanel({
  filters,
  onFiltersChange,
  facets,
  resultCount,
  isLoading = false,
}: TaskSearchPanelProps) {
  const form = useForm<FilterFormValues>({
    defaultValues: filtersToFormValues(filters),
    onSubmit: async () => {
      // Form submission is handled by onChange callbacks
    },
  })

  const handleFilterChange = useCallback(
    (newValues: Partial<FilterFormValues>) => {
      const currentValues = form.getFieldValue('search')
      const updatedValues: FilterFormValues = {
        ...filtersToFormValues(filters),
        ...newValues,
      }
      onFiltersChange(formValuesToFilters(updatedValues))
    },
    [filters, onFiltersChange, form]
  )

  const handleClearAll = () => {
    onFiltersChange({})
    form.reset()
  }

  const handleLoadPreset = (presetFilters: TaskSearchFilters) => {
    onFiltersChange(presetFilters)
    form.setFieldValue('status', filtersToFormValues(presetFilters).status)
    form.setFieldValue('priority', filtersToFormValues(presetFilters).priority)
    form.setFieldValue('agents', filtersToFormValues(presetFilters).agents)
    form.setFieldValue('sprints', filtersToFormValues(presetFilters).sprints)
    form.setFieldValue('deadlineFrom', filtersToFormValues(presetFilters).deadlineFrom)
    form.setFieldValue('deadlineTo', filtersToFormValues(presetFilters).deadlineTo)
  }

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((v) => v !== undefined)
  }, [filters])

  const statusOptions = useMemo(() => Object.keys(facets.status), [facets.status])
  const priorityOptions = useMemo(() => Object.keys(facets.priority), [facets.priority])
  const agentOptions = useMemo(() => Object.keys(facets.assignedAgent), [facets.assignedAgent])
  const sprintOptions = useMemo(() => Object.keys(facets.sprint), [facets.sprint])

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 space-y-6">
      {/* Header with Result Count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <p className="text-sm text-slate-400 mt-1">
            {isLoading ? (
              'Loading results...'
            ) : (
              <>
                <span className="font-medium">{resultCount}</span> task
                {resultCount !== 1 ? 's' : ''} found
              </>
            )}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear All
          </button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Multi-Select */}
        {statusOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <div className="space-y-2 border rounded border-slate-600 bg-slate-700/30 p-3 max-h-40 overflow-y-auto">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtersToFormValues(filters).status.includes(status)}
                    onChange={(e) => {
                      const current = filtersToFormValues(filters).status
                      const newStatus = e.target.checked ? [...current, status] : current.filter((s) => s !== status)
                      handleFilterChange({ status: newStatus })
                    }}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors flex-1 capitalize">
                    {status.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {facets.status[status as keyof typeof facets.status] || 0}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Priority Multi-Select */}
        {priorityOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <div className="space-y-2 border rounded border-slate-600 bg-slate-700/30 p-3 max-h-40 overflow-y-auto">
              {priorityOptions.map((priority) => (
                <label key={priority} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtersToFormValues(filters).priority.includes(priority)}
                    onChange={(e) => {
                      const current = filtersToFormValues(filters).priority
                      const newPriority = e.target.checked
                        ? [...current, priority]
                        : current.filter((p) => p !== priority)
                      handleFilterChange({ priority: newPriority })
                    }}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors flex-1 capitalize">
                    {priority}
                  </span>
                  <span className="text-xs text-slate-500">
                    {facets.priority[priority as keyof typeof facets.priority] || 0}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Agent Multi-Select */}
        {agentOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Agent</label>
            <div className="space-y-2 border rounded border-slate-600 bg-slate-700/30 p-3 max-h-40 overflow-y-auto">
              {agentOptions.map((agent) => (
                <label key={agent} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtersToFormValues(filters).agents.includes(agent)}
                    onChange={(e) => {
                      const current = filtersToFormValues(filters).agents
                      const newAgents = e.target.checked
                        ? [...current, agent]
                        : current.filter((a) => a !== agent)
                      handleFilterChange({ agents: newAgents })
                    }}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors flex-1">
                    {agent}
                  </span>
                  <span className="text-xs text-slate-500">
                    {facets.assignedAgent[agent] || 0}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sprint Multi-Select */}
        {sprintOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sprint</label>
            <div className="space-y-2 border rounded border-slate-600 bg-slate-700/30 p-3 max-h-40 overflow-y-auto">
              {sprintOptions.map((sprint) => (
                <label key={sprint} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtersToFormValues(filters).sprints.includes(sprint)}
                    onChange={(e) => {
                      const current = filtersToFormValues(filters).sprints
                      const newSprints = e.target.checked
                        ? [...current, sprint]
                        : current.filter((s) => s !== sprint)
                      handleFilterChange({ sprints: newSprints })
                    }}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors flex-1">
                    {sprint}
                  </span>
                  <span className="text-xs text-slate-500">
                    {facets.sprint[sprint] || 0}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Deadline From */}
        <div>
          <label htmlFor="deadline-from" className="block text-sm font-medium text-slate-300 mb-2">
            Deadline From
          </label>
          <input
            id="deadline-from"
            type="date"
            value={filtersToFormValues(filters).deadlineFrom}
            onChange={(e) => handleFilterChange({ deadlineFrom: e.target.value })}
            className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Deadline To */}
        <div>
          <label htmlFor="deadline-to" className="block text-sm font-medium text-slate-300 mb-2">
            Deadline To
          </label>
          <input
            id="deadline-to"
            type="date"
            value={filtersToFormValues(filters).deadlineTo}
            onChange={(e) => handleFilterChange({ deadlineTo: e.target.value })}
            className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-700 text-slate-300 text-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filter Preset Manager */}
      <div className="pt-4 border-t border-slate-700">
        <FilterPresetManager currentFilters={filters} onLoadPreset={handleLoadPreset} />
      </div>
    </div>
  )
}
