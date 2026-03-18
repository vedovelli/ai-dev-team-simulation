import { useForm } from '@tanstack/react-form'
import type { TaskListFilters } from '../../hooks/useTaskList'

interface TaskFilterPanelProps {
  onFiltersChange?: (filters: TaskListFilters) => void
  onClearFilters?: () => void
}

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['backlog', 'in-progress', 'in-review', 'done']
const AGENTS = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5']
const SPRINTS = ['sprint-1', 'sprint-2', 'sprint-3']
const ASSIGNEES = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5']

/**
 * Task filter panel using TanStack Form
 *
 * Provides filter fields for priority, status, agent, sprint, assignee, and date range.
 * Form state drives task list query filters.
 *
 * @example
 * ```tsx
 * <TaskFilterPanel
 *   onFiltersChange={(filters) => {
 *     // filters automatically update the query key
 *     // useTaskList will refetch with new filters and reset to page 1
 *   }}
 * />
 * ```
 */
export function TaskFilterPanel({ onFiltersChange, onClearFilters }: TaskFilterPanelProps) {
  const form = useForm<TaskListFilters>({
    defaultValues: {
      priority: null,
      status: null,
      agent: null,
      sprint: null,
      assignee: null,
      dateFrom: null,
      dateTo: null,
    },
    onSubmit: async ({ value }) => {
      // No submission needed - real-time filtering
      onFiltersChange?.(value)
    },
  })

  const handleFilterChange = () => {
    const filters = form.getFieldValue('priority') ||
      form.getFieldValue('status') ||
      form.getFieldValue('agent') ||
      form.getFieldValue('sprint') ||
      form.getFieldValue('assignee') ||
      form.getFieldValue('dateFrom') ||
      form.getFieldValue('dateTo')
      ? form.state.values
      : {}

    onFiltersChange?.(form.state.values)
  }

  const handleClear = () => {
    form.reset()
    onClearFilters?.()
    onFiltersChange?.({
      priority: null,
      status: null,
      agent: null,
      sprint: null,
      assignee: null,
      dateFrom: null,
      dateTo: null,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        {/* Priority */}
        <div>
          <form.Field
            name="priority"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-priority"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Priority
                </label>
                <select
                  id="filter-priority"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

        {/* Status */}
        <div>
          <form.Field
            name="status"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-status"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="filter-status"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

        {/* Agent */}
        <div>
          <form.Field
            name="agent"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-agent"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Agent
                </label>
                <select
                  id="filter-agent"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All agents</option>
                  {AGENTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

        {/* Sprint */}
        <div>
          <form.Field
            name="sprint"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-sprint"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Sprint
                </label>
                <select
                  id="filter-sprint"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All sprints</option>
                  {SPRINTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

        {/* Assignee */}
        <div>
          <form.Field
            name="assignee"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-assignee"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Assignee
                </label>
                <select
                  id="filter-assignee"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All assignees</option>
                  {ASSIGNEES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <form.Field
            name="dateFrom"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-date-from"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  From
                </label>
                <input
                  id="filter-date-from"
                  type="date"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          />
          <form.Field
            name="dateTo"
            children={(field) => (
              <div>
                <label
                  htmlFor="filter-date-to"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  To
                </label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={field.state.value || ''}
                  onChange={(e) => {
                    field.handleChange(e.target.value || null)
                    handleFilterChange()
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          />
        </div>

        {/* Clear Filters Button */}
        <button
          type="button"
          onClick={handleClear}
          className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear filters
        </button>
      </form>
    </div>
  )
}
