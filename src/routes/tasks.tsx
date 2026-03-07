import { useMemo, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { TaskTable } from '../components/TaskTable'
import { TaskFiltersPanel } from '../components/TaskFiltersPanel'
import { useTaskFilters } from '../hooks/useTaskFilters'
import { useTasks } from '../hooks/queries/tasks'
import { RouteErrorBoundary } from '../components/RouteErrorBoundary'

/* eslint-disable react-refresh/only-export-components */
function TasksRoute() {
  const {
    status,
    priority,
    search,
    assignee,
    page,
    limit,
    updateFilter,
    setPage,
    clearAllFilters,
  } = useTaskFilters()

  // Fetch tasks with current filters and pagination
  const { data: response, isLoading, error } = useTasks({
    status: status || undefined,
    priority: priority || undefined,
    search: search || undefined,
    assignee: assignee || undefined,
    page,
    pageSize: limit,
  })

  const tasks = response?.data || []
  const totalCount = response?.total || 0
  const totalPages = response?.totalPages || 1

  if (error) {
    return (
      <RouteErrorBoundary
        error={error}
        resetError={() => window.location.reload()}
      />
    )
  }

  // Extract unique assignees from current results for the filter dropdown
  const uniqueAssignees = useMemo(
    () => [...new Set(tasks.map((t) => t.assignee))].sort(),
    [tasks]
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="mt-2 text-gray-600">
            Filter and manage tasks. Filters are automatically saved in the URL for easy sharing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <TaskFiltersPanel
              status={status}
              priority={priority}
              search={search}
              assignee={assignee}
              onStatusChange={(newStatus) =>
                updateFilter({ status: newStatus })
              }
              onPriorityChange={(newPriority) =>
                updateFilter({ priority: newPriority })
              }
              onSearchChange={(newSearch) =>
                updateFilter({ search: newSearch })
              }
              onAssigneeChange={(newAssignee) =>
                updateFilter({ assignee: newAssignee || undefined })
              }
              onClearFilters={clearAllFilters}
              assignees={uniqueAssignees}
              isLoading={isLoading}
            />
          </div>

          {/* Table Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    Showing {tasks.length} of {totalCount} tasks
                    {page > 1 && ` (page ${page} of ${totalPages})`}
                  </>
                )}
              </div>
            </div>

            {/* Task Table */}
            <TaskTable data={tasks} isLoading={isLoading} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1 || isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No tasks match your filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TasksRouteWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Tasks</h1>
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          </div>
        </div>
      }
    >
      <TasksRoute />
    </Suspense>
  )
}

export const Route = createFileRoute('/tasks')({
  component: TasksRouteWrapper,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
