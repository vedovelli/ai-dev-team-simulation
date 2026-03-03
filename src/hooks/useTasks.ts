import { useQuery } from '@tanstack/react-query'
import type { Task, TaskStatus, TaskPriority } from '../types/task'

interface TasksResponse {
  data: Task[]
  total: number
  pageIndex: number
  pageSize: number
}

/**
 * Query parameters for filtering tasks
 *
 * All parameters are optional. When a parameter is provided, tasks are filtered
 * by that criteria. Multiple parameters are combined with AND logic.
 */
export interface TaskQueryParams {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  team?: string
  sprint?: string
  assignee?: string
}

/**
 * Fetch tasks with optional filtering
 *
 * Uses TanStack Query for server state management with automatic caching.
 * Query is automatically invalidated when mutations complete.
 *
 * @param params - Optional filter parameters
 * @returns Query object with tasks data, loading, and error states
 *
 * @example
 * // Fetch all tasks
 * const { data: tasks, isLoading } = useTasks()
 *
 * @example
 * // Fetch with filters
 * const { data: tasks } = useTasks({
 *   status: 'in-progress',
 *   team: 'frontend',
 *   priority: 'high'
 * })
 *
 * @example
 * // Handle different states
 * const { data: tasks, isLoading, isError, error } = useTasks()
 * if (isLoading) return <LoadingSpinner />
 * if (isError) return <ErrorMessage error={error} />
 * return <TaskList tasks={tasks} />
 *
 * @see docs/guides/tanstack-query.md for detailed patterns
 */
export function useTasks(params?: TaskQueryParams) {
  const queryKey = ['tasks', params]

  return useQuery<Task[]>({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/tasks', window.location.origin)

      if (params) {
        if (params.status) {
          url.searchParams.set('status', params.status)
        }
        if (params.priority) {
          url.searchParams.set('priority', params.priority)
        }
        if (params.search) {
          url.searchParams.set('search', params.search)
        }
        if (params.team) {
          url.searchParams.set('team', params.team)
        }
        if (params.sprint) {
          url.searchParams.set('sprint', params.sprint)
        }
        if (params.assignee) {
          url.searchParams.set('assignee', params.assignee)
        }
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const result = (await response.json()) as TasksResponse
      return result.data
    },
  })
}
