import { useCallback, useEffect, useState } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { useTable } from '../hooks/useTable'
import { SimpleTable } from './SimpleTable/SimpleTable'
import { TableFilters, type FilterOption } from './TableFilters'
import { type Task } from '../types/task'

interface TaskFilterSearch {
  status?: string
  assignee?: string
  team?: string
  priority?: string
}

/**
 * Example implementation of advanced filtering with useTable hook.
 * Demonstrates:
 * - URL persistence via TanStack Router
 * - Advanced filter UI with multiple select dropdowns
 * - Integration with useTable hook filters option
 * - MSW mock endpoint with query param handling
 */
export function FilteredTaskTableExample() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '__root__' }) as TaskFilterSearch
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch tasks with filter query params
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchParams.status) params.append('status', searchParams.status)
        if (searchParams.assignee) params.append('assignee', searchParams.assignee)
        if (searchParams.team) params.append('team', searchParams.team)
        if (searchParams.priority) params.append('priority', searchParams.priority)

        const response = await fetch(
          `/api/tasks?${params.toString()}&pageSize=100`
        )
        const data = await response.json()
        setTasks(data.tasks || [])
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [searchParams])

  // Initialize useTable with current filters
  const { sortedAndFilteredData, handleSort, setFilter, clearFilters } =
    useTable<Task>({
      data: tasks,
      filters: {
        status: searchParams.status,
        assignee: searchParams.assignee,
        team: searchParams.team,
        priority: searchParams.priority,
      },
      onFilterChange: (filters) => {
        navigate({
          search: {
            status: filters.status || undefined,
            assignee: filters.assignee || undefined,
            team: filters.team || undefined,
            priority: filters.priority || undefined,
          },
        })
      },
    })

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      setFilter(key, value)
      navigate({
        search: {
          ...searchParams,
          [key]: value || undefined,
        },
      })
    },
    [navigate, searchParams, setFilter]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    navigate({
      search: {} as TaskFilterSearch,
    })
  }, [navigate, clearFilters])

  const statusOptions: FilterOption[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'in-review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ]

  const assigneeOptions: FilterOption[] = [
    { value: 'John Doe', label: 'John Doe' },
    { value: 'Jane Smith', label: 'Jane Smith' },
    { value: 'Bob Johnson', label: 'Bob Johnson' },
    { value: 'Alice Williams', label: 'Alice Williams' },
    { value: 'Charlie Brown', label: 'Charlie Brown' },
    { value: 'Diana Prince', label: 'Diana Prince' },
  ]

  const teamOptions: FilterOption[] = [
    { value: 'Frontend', label: 'Frontend' },
    { value: 'Backend', label: 'Backend' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Design', label: 'Design' },
    { value: 'QA', label: 'QA' },
  ]

  const priorityOptions: FilterOption[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Filtered Task Table
          </h1>
          <p className="text-gray-600 mb-6">
            Advanced filtering with URL persistence. Filters are synced to the
            URL and persist across page reloads.
          </p>

          <TableFilters
            filters={{
              status: searchParams.status,
              assignee: searchParams.assignee,
              team: searchParams.team,
              priority: searchParams.priority,
            }}
            onFilterChange={handleFilterChange}
            onClear={handleClearAll}
            filterConfig={[
              { key: 'status', label: 'Status', options: statusOptions },
              { key: 'assignee', label: 'Assignee', options: assigneeOptions },
              { key: 'team', label: 'Team', options: teamOptions },
              { key: 'priority', label: 'Priority', options: priorityOptions },
            ]}
          />

          <SimpleTable<Task>
            data={sortedAndFilteredData}
            columns={[
              {
                key: 'title',
                label: 'Title',
                sortable: true,
              },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (value: string) => (
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'done'
                        ? 'bg-green-100 text-green-800'
                        : value === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : value === 'in-review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {value}
                  </span>
                ),
              },
              {
                key: 'assignee',
                label: 'Assignee',
                sortable: true,
              },
              {
                key: 'team',
                label: 'Team',
                sortable: true,
              },
              {
                key: 'priority',
                label: 'Priority',
                sortable: true,
                render: (value: string) => (
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'high'
                        ? 'bg-red-100 text-red-800'
                        : value === 'medium'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {value}
                  </span>
                ),
              },
              {
                key: 'storyPoints',
                label: 'Story Points',
                sortable: true,
              },
            ]}
            isLoading={isLoading}
            emptyMessage="No tasks match your filters"
          />

          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Implementation Guide
            </h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How It Works
                </h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      useTable
                    </code>{' '}
                    accepts a{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      filters
                    </code>{' '}
                    option with URL search param values
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      setFilter
                    </code>{' '}
                    updates local filter state and calls{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      onFilterChange
                    </code>
                  </li>
                  <li>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      onFilterChange
                    </code>{' '}
                    navigates with updated search params
                  </li>
                  <li>
                    URL changes trigger data fetch with filter query params
                  </li>
                  <li>
                    MSW mock endpoint filters tasks based on query params
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Code Example
                </h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`const { setFilter, filters } = useTable({
  data: tasks,
  filters: {
    status: searchParams.status,
    assignee: searchParams.assignee,
  },
  onFilterChange: (filters) => {
    navigate({
      search: {
        status: filters.status,
        assignee: filters.assignee,
      }
    })
  }
})

<TableFilters
  filters={filters}
  onFilterChange={(key, value) => {
    setFilter(key, value)
    navigate({ search: { ...filters, [key]: value } })
  }}
/>`}
                </pre>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-blue-900 text-xs">
                  <strong>Note:</strong> The MSW mock endpoint at{' '}
                  <code>/api/tasks</code> already handles query parameters
                  (status, assignee, team, priority). Filters are applied
                  server-side in the mock, then refined again client-side by
                  useTable if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
