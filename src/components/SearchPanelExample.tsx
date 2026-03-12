import { useQuery } from '@tanstack/react-query'
import { SearchPanel } from './SearchPanel'
import { useAdvancedTaskFilters } from '../hooks/useAdvancedTaskFilters'
import type { Task } from '../types/task'

/**
 * Example: SearchPanel Integration with Task List
 *
 * This example demonstrates:
 * 1. Using SearchPanel for filtering
 * 2. Connecting to useAdvancedTaskFilters hook
 * 3. Displaying filtered results with pagination
 * 4. Handling loading and empty states
 *
 * @example
 * <SearchPanelExample />
 */
export function SearchPanelExample() {
  const filters = useAdvancedTaskFilters()

  // Fetch filtered tasks using filter state
  const { data: response, isLoading, error } = useQuery({
    queryKey: filters.queryKey,
    queryFn: async () => {
      // In real app, send filters.state to API
      const params = new URLSearchParams({
        search: filters.debouncedSearch,
        status: filters.status.join(','),
        assignee: filters.assignee || '',
        priority: filters.priority || '',
        page: filters.page.toString(),
        pageSize: filters.pageSize.toString(),
      })

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
    staleTime: filters.queryOptions.staleTime,
    gcTime: filters.queryOptions.gcTime,
    retry: filters.queryOptions.retry,
  })

  const tasks: Task[] = response?.data || []
  const totalPages = response?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <SearchPanel isLoading={isLoading} agents={['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']} />

      {/* Results Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tasks {filters.hasActiveFilters && '(Filtered)'}
          </h2>
          {response && (
            <span className="text-sm text-gray-600">
              {response.total} {response.total === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error loading tasks: {String(error)}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              {filters.hasActiveFilters ? 'No tasks match your filters.' : 'No tasks found.'}
            </p>
            {filters.hasActiveFilters && (
              <button
                onClick={filters.clearAllFilters}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Task List */}
        {!isLoading && tasks.length > 0 && (
          <>
            <div className="space-y-2 mb-6">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {task.status}
                        </span>
                        {task.assignee && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {task.assignee}
                          </span>
                        )}
                        <span>{task.priority}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-400">{task.storyPoints}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => filters.setPage(filters.page - 1)}
                  disabled={filters.page === 1 || isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {filters.page} of {totalPages}
                </span>
                <button
                  onClick={() => filters.setPage(filters.page + 1)}
                  disabled={filters.page === totalPages || isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
