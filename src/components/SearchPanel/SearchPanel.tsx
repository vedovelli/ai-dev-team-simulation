import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAdvancedTaskFilters } from '../../hooks/useAdvancedTaskFilters'
import type { TaskStatus } from '../../types/task'

interface SearchPanelProps {
  agents?: string[]
  onSearchApply?: () => void
  isLoading?: boolean
  debounceMs?: number
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

/**
 * Validation schema for search panel filters
 */
const searchPanelSchema = z.object({
  search: z.string().optional().default(''),
  status: z.array(z.enum(['backlog', 'in-progress', 'in-review', 'done'])).default([]),
  assignee: z.string().optional().nullable().default(null),
})

export type SearchPanelFormData = z.infer<typeof searchPanelSchema>

/**
 * SearchPanel UI Component for task filtering
 *
 * Features:
 * - Search input with debounce indicator
 * - Status multi-select filter
 * - Agent/Assignee filter dropdown
 * - Active filter chips/tags display
 * - Clear filters button
 * - Cmd+K keyboard shortcut to focus search
 * - Responsive design
 * - Full accessibility support (ARIA labels, keyboard navigation)
 *
 * Integration:
 * - Works with useAdvancedTaskFilters hook
 * - Form state managed by TanStack Form
 * - Validation with Zod
 *
 * @example
 * const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents })
 * <SearchPanel agents={agents?.map(a => a.name)} />
 */
export function SearchPanel({
  agents = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'],
  isLoading = false,
  debounceMs = 300,
}: SearchPanelProps) {
  const filters = useAdvancedTaskFilters({ searchDebounceMs: debounceMs })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  const form = useForm<SearchPanelFormData>({
    defaultValues: {
      search: '',
      status: [],
      assignee: null,
    },
    onSubmit: async ({ value }) => {
      // Sync form state to filters
      filters.setSearchFilter(value.search)
      filters.setStatusFilter(value.status as TaskStatus[])
      filters.setAssigneeFilter(value.assignee)
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: searchPanelSchema,
    },
  })

  // Debounced submission - apply filters as user types
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      form.handleSubmit()
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [form.state.values, debounceMs, form])

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    const { search, status, assignee } = form.state.values
    return (search ? 1 : 0) + (status.length > 0 ? status.length : 0) + (assignee ? 1 : 0)
  }, [form.state.values])

  const handleClearAll = useCallback(() => {
    form.reset()
    filters.clearAllFilters()
  }, [form, filters])

  const handleStatusToggle = useCallback(
    (status: TaskStatus) => {
      const statuses = form.state.values.status || []
      const newStatuses = statuses.includes(status)
        ? statuses.filter((s) => s !== status)
        : [...statuses, status]
      form.setFieldValue('status', newStatuses)
    },
    [form]
  )

  const handleRemoveFilter = useCallback(
    (filterType: 'status', value: string) => {
      if (filterType === 'status') {
        const statuses = form.state.values.status || []
        const newStatuses = statuses.filter((s) => s !== value)
        form.setFieldValue('status', newStatuses)
      }
    },
    [form]
  )

  const handleRemoveAssignee = useCallback(() => {
    form.setFieldValue('assignee', null)
  }, [form])

  // Cmd+K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const searchValue = form.state.values.search || ''
  const isSearching = searchValue.length > 0 && filters.debouncedSearch !== searchValue

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      {/* Header with title and filter badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Search & Filter Tasks</h2>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active
            </span>
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Search Input Field */}
      <form.Field
        name="search"
        children={(field) => (
          <div>
            <label htmlFor="search-tasks" className="block text-sm font-medium text-gray-700 mb-2">
              Search Tasks
            </label>
            <div className="relative">
              <input
                ref={searchInputRef}
                id="search-tasks"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isLoading}
                placeholder="Type to search tasks... (Cmd+K)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Search tasks"
                aria-describedby="search-help"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p id="search-help" className="mt-1 text-xs text-gray-500">
              {isLoading || isSearching ? '🔍 Searching...' : 'Search updates with 300ms debounce'}
            </p>
          </div>
        )}
      />

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filter - Multi-select Checkboxes */}
        <form.Field
          name="status"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      id={`status-${option.value}`}
                      type="checkbox"
                      checked={(field.state.value || []).includes(option.value)}
                      onChange={() => handleStatusToggle(option.value)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border border-gray-300 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      aria-label={`Filter by ${option.label}`}
                    />
                    <label
                      htmlFor={`status-${option.value}`}
                      className="ml-3 text-sm text-gray-700 cursor-pointer select-none"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        />

        {/* Assignee Filter */}
        <form.Field
          name="assignee"
          children={(field) => (
            <div>
              <label htmlFor="assignee-filter" className="block text-sm font-medium text-gray-700 mb-3">
                Assigned To
              </label>
              <select
                id="assignee-filter"
                value={field.state.value || ''}
                onChange={(e) => field.handleChange(e.target.value ? e.target.value : null)}
                onBlur={field.handleBlur}
                disabled={isLoading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Filter by assignee"
              >
                <option value="">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      </div>

      {/* Active Filter Chips/Tags */}
      {activeFilterCount > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {/* Status chips */}
            {(form.state.values.status || []).map((status) => {
              const label = STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status
              return (
                <div
                  key={`chip-${status}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700"
                >
                  <span>{label}</span>
                  <button
                    onClick={() => handleRemoveFilter('status', status)}
                    disabled={isLoading}
                    className="text-blue-500 hover:text-blue-700 font-bold focus:outline-none disabled:opacity-50"
                    aria-label={`Remove ${label} filter`}
                  >
                    ✕
                  </button>
                </div>
              )
            })}

            {/* Assignee chip */}
            {form.state.values.assignee && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700">
                <span>{form.state.values.assignee}</span>
                <button
                  onClick={handleRemoveAssignee}
                  disabled={isLoading}
                  className="text-purple-500 hover:text-purple-700 font-bold focus:outline-none disabled:opacity-50"
                  aria-label={`Remove ${form.state.values.assignee} assignee filter`}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search chip */}
            {form.state.values.search && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700">
                <span>"{form.state.values.search}"</span>
                <button
                  onClick={() => form.setFieldValue('search', '')}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-gray-700 font-bold focus:outline-none disabled:opacity-50"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-3">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            Loading results...
          </div>
        </div>
      )}
    </div>
  )
}
