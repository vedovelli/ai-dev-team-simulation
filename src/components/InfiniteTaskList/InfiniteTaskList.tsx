import { useRef, useEffect, useCallback } from 'react'
import type { UseInfiniteQueryResult } from '@tanstack/react-query'
import type { Task } from '../../types/task'

interface TaskListResponse {
  data: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface InfiniteTaskListProps {
  query: UseInfiniteQueryResult<TaskListResponse, Error>
  onTaskClick?: (task: Task) => void
  useIntersectionObserver?: boolean
}

/**
 * Infinite scroll task list component
 *
 * Renders tasks with pagination support using TanStack Query's infinite query.
 * Provides loading, empty, and error states.
 *
 * @example
 * ```tsx
 * const query = useTaskList(filters)
 *
 * <InfiniteTaskList
 *   query={query}
 *   onTaskClick={(task) => console.log(task)}
 *   useIntersectionObserver
 * />
 * ```
 */
export function InfiniteTaskList({
  query,
  onTaskClick,
  useIntersectionObserver = false,
}: InfiniteTaskListProps) {
  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } = query
  const observerTarget = useRef<HTMLDivElement>(null)

  // Setup intersection observer for auto-load
  useEffect(() => {
    if (!useIntersectionObserver || !observerTarget.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, useIntersectionObserver])

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const tasks = data?.pages.flatMap((page) => page.data) ?? []
  const total = data?.pages[0]?.total ?? 0

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-900">Failed to load tasks</p>
        <p className="text-sm text-red-700 mt-1">
          {error?.message || 'An error occurred while fetching tasks'}
        </p>
        <button
          onClick={() => query.refetch()}
          className="mt-3 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900">No tasks found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to find tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Task count */}
      <div className="text-xs text-gray-500">
        Showing {tasks.length} of {total} tasks
      </div>

      {/* Tasks list */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onTaskClick?.(task)
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex px-2 py-1 bg-gray-100 rounded">
                    {task.sprint}
                  </span>
                  <span className="inline-flex px-2 py-1 bg-gray-100 rounded">
                    {task.assignee}
                  </span>
                </div>
              </div>
              <div className="ml-2 flex flex-col items-end gap-1">
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading skeleton for next page */}
      {isFetchingNextPage && (
        <div className="space-y-2 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Load more button / Observer target */}
      <div ref={observerTarget} className="pt-4">
        {hasNextPage && !useIntersectionObserver && (
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'bg-green-100 text-green-800'
    case 'in-review':
      return 'bg-purple-100 text-purple-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'backlog':
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
    default:
      return 'bg-green-100 text-green-800'
  }
}
