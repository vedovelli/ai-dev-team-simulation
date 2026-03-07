import { useState, useMemo, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AgentTaskTable } from '../../components/AgentTaskTable'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import { useTable } from '../../hooks/useTable'
import type { Task } from '../../types/task'

interface PaginationParams {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface TasksResponse {
  success: boolean
  data: Task[]
  pagination: PaginationParams
}

async function fetchTasks(
  page: number,
  limit: number,
  status?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<TasksResponse> {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())

  if (status) params.append('status', status)
  if (sortBy) params.append('sortBy', sortBy)
  if (sortOrder) params.append('sortOrder', sortOrder)

  const response = await fetch(`/api/tasks?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch tasks')

  return response.json()
}

/* eslint-disable react-refresh/only-export-components */
function AgentTasksRoute() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data: tasksResponse, isLoading, error } = useQuery({
    queryKey: ['agent-tasks', page, limit, statusFilter, sortBy, sortOrder],
    queryFn: () => fetchTasks(page, limit, statusFilter || undefined, sortBy, sortOrder),
  })

  const { sortedAndFilteredData, sortKey, sortOrder: tableSortOrder, handleSort } = useTable({
    data: tasksResponse?.data || [],
    initialSortKey: sortBy as keyof Task,
    initialSortOrder: sortOrder,
  })

  // Status update mutation with optimistic update
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update task status')
      return response.json()
    },

    onSuccess: () => {
      // Refetch the task list and invalidate detail view
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
    },
  })

  const handleStatusChange = (taskId: string, newStatus: string) => {
    statusUpdateMutation.mutate({ taskId, newStatus })
  }

  const handleSort = (key: keyof Task) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key as string)
      setSortOrder('asc')
    }
  }

  if (error) {
    return (
      <RouteErrorBoundary
        error={error}
        resetError={() => window.location.reload()}
      />
    )
  }

  const pagination = tasksResponse?.pagination

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Task Queue</h1>
          <p className="mt-2 text-gray-600">
            View and manage tasks assigned to agents. Click on a task to see details.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value))
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 items</option>
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
            </select>
          </div>

          {statusFilter && (
            <div className="flex items-end">
              <button
                onClick={() => setStatusFilter('')}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Task Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {sortedAndFilteredData.length} of {pagination?.total || 0} tasks
          </p>
        </div>

        {/* Table */}
        <AgentTaskTable
          data={sortedAndFilteredData}
          isLoading={isLoading}
          onStatusChange={handleStatusChange}
          sortKey={sortKey as keyof Task | null}
          sortOrder={tableSortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentTasksRouteWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Agent Task Queue</h1>
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          </div>
        </div>
      }
    >
      <AgentTasksRoute />
    </Suspense>
  )
}

export const Route = createFileRoute('/agent-tasks/')({
  component: AgentTasksRouteWrapper,
  errorComponent: ({ error }) => <RouteErrorBoundary error={error} />,
})
