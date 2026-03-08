import { useCallback, useEffect, useState, useMemo } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { TaskFiltersPanel, type TaskFiltersFormData } from './TaskFiltersPanel'
import { TaskTable } from './TaskTable'
import type { Task } from '../types/task'

interface TaskFilterSearch {
  search?: string
  priority?: string
  statuses?: string
  assignee?: string
  dueDateFrom?: string
  dueDateTo?: string
}

/**
 * TaskFilterPanelExample Component
 *
 * Demonstrates complete integration of TaskFiltersPanel with TaskTable:
 * - TanStack Form for filter state management
 * - URL query param persistence via TanStack Router
 * - Server-side filtering via MSW mock endpoint
 * - Loading and empty states
 * - Active filter count display
 * - Task count showing filtered results
 *
 * Features:
 * - Priority filter (single select)
 * - Status filter (multi-select checkboxes)
 * - Assignee filter (dropdown)
 * - Date range filter (due date from/to)
 * - Full-text search with 300ms debounce
 * - Apply Filters and Clear All actions
 */
export function TaskFilterPanelExample() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '__root__' }) as TaskFilterSearch
  const [tasks, setTasks] = useState<Task[]>([])
  const [totalTasks, setTotalTasks] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch tasks with current filters
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchParams.search) params.append('search', searchParams.search)
      if (searchParams.priority) params.append('priority', searchParams.priority)
      if (searchParams.statuses) params.append('statuses', searchParams.statuses)
      if (searchParams.assignee) params.append('assignee', searchParams.assignee)
      if (searchParams.dueDateFrom) params.append('dueDateFrom', searchParams.dueDateFrom)
      if (searchParams.dueDateTo) params.append('dueDateTo', searchParams.dueDateTo)

      const response = await fetch(`/api/tasks?${params.toString()}`)
      const data = await response.json()
      setTasks(data.data || [])
      setTotalTasks(data.pagination?.total || (data.data?.length || 0))
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // Fetch tasks when filters change
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Handle filter application from form
  const handleFiltersApply = useCallback(
    (filters: TaskFiltersFormData) => {
      const params: Record<string, string | undefined> = {}

      if (filters.search) params.search = filters.search
      if (filters.priority) params.priority = filters.priority
      if (filters.statuses && filters.statuses.length > 0) {
        params.statuses = filters.statuses.join(',')
      }
      if (filters.assignee) params.assignee = filters.assignee
      if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom
      if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo

      navigate({
        search: params,
      })
    },
    [navigate]
  )

  // Get agent list from tasks (for assignee filter options)
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set(tasks.map((task) => task.assignee).filter(Boolean))
    return Array.from(uniqueAssignees).sort()
  }, [tasks])

  // Convert URL params back to form data
  const currentFilters: TaskFiltersFormData = useMemo(
    () => ({
      search: searchParams.search || '',
      priority: (searchParams.priority as any) || null,
      statuses: searchParams.statuses ? searchParams.statuses.split(',') as any : [],
      assignee: searchParams.assignee || null,
      dueDateFrom: searchParams.dueDateFrom || '',
      dueDateTo: searchParams.dueDateTo || '',
    }),
    [searchParams]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
            <p className="text-gray-600">
              Filter and manage your tasks with advanced filtering capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Panel */}
            <div className="lg:col-span-1">
              <TaskFiltersPanel
                onFiltersApply={handleFiltersApply}
                assignees={assignees}
                isLoading={isLoading}
                debounceMs={300}
              />
            </div>

            {/* Tasks Section */}
            <div className="lg:col-span-3 space-y-4">
              {/* Results Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600">
                  {isLoading ? (
                    'Fetching tasks...'
                  ) : tasks.length > 0 ? (
                    <>
                      Showing <span className="font-semibold text-gray-900">{tasks.length}</span> of{' '}
                      <span className="font-semibold text-gray-900">{totalTasks}</span> tasks
                    </>
                  ) : (
                    'No tasks match your filters'
                  )}
                </p>
              </div>

              {/* Task Table */}
              <TaskTable data={tasks} isLoading={isLoading} />
            </div>
          </div>

          {/* Implementation Documentation */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Implementation Guide</h2>
            <div className="space-y-6 text-sm text-gray-700">
              {/* Architecture Overview */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Architecture</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>TaskFiltersPanel: TanStack Form-based filter UI component</li>
                  <li>Form state synced to URL query parameters via TanStack Router</li>
                  <li>URL changes trigger data fetching with filter parameters</li>
                  <li>MSW mock endpoint filters tasks server-side</li>
                  <li>TaskTable displays filtered results with sorting capabilities</li>
                </ul>
              </div>

              {/* Filter Types */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Available Filters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Single-Select</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Priority (low/medium/high)</li>
                      <li>Assignee (dropdown)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Multi-Select</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Status (backlog/in-progress/in-review/done)</li>
                      <li>Date Range (due date from/to)</li>
                      <li>Search (text with 300ms debounce)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Form Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Form Features</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>TanStack Form for state management</li>
                  <li>Zod schema for validation</li>
                  <li>Debounced auto-submission (300ms configurable)</li>
                  <li>Active filter count badge</li>
                  <li>Apply Filters and Clear All action buttons</li>
                  <li>URL query param persistence for bookmarking/sharing</li>
                  <li>Loading state support during data fetching</li>
                </ul>
              </div>

              {/* Code Example */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Basic Usage</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{`// In your component
const handleFiltersApply = (filters: TaskFiltersFormData) => {
  navigate({
    search: {
      search: filters.search,
      priority: filters.priority,
      statuses: filters.statuses.join(','),
      assignee: filters.assignee,
      dueDateFrom: filters.dueDateFrom,
      dueDateTo: filters.dueDateTo,
    },
  })
}

<TaskFiltersPanel
  onFiltersApply={handleFiltersApply}
  assignees={assigneeList}
  isLoading={isLoading}
  debounceMs={300}
/>`}
                </pre>
              </div>

              {/* Integration Notes */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-900 font-medium mb-2">Integration Notes</p>
                <ul className="space-y-1 text-blue-800 list-disc list-inside text-xs">
                  <li>URL query params enable filter persistence across page reloads</li>
                  <li>MSW mock endpoint at /api/tasks handles filter query parameters</li>
                  <li>Form submission automatically syncs to URL via navigate()</li>
                  <li>Debounced submission prevents excessive network requests</li>
                  <li>Active filter count updates in real-time as user changes filters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
