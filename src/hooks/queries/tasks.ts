import { useQuery } from '@tanstack/react-query'
import type { Task } from '../../types/task'

/**
 * Query keys factory for task queries.
 * Follows TanStack Query best practices with structured cache keys for proper invalidation.
 * @see https://tanstack.com/query/latest/docs/react/important-defaults
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), { ...filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

export interface TaskFilters {
  status?: string
  assignee?: string
  priority?: string
  search?: string
  page?: number
  pageSize?: number
}

interface TasksListResponse {
  data: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Fetch tasks with filtering and pagination support.
 * Uses TanStack Query's structured query keys for automatic cache management.
 * When filter parameters change, React Query recognizes the new cache entry.
 * @param filters - Filter and pagination parameters
 * @returns Tasks array with pagination metadata, loading and error states
 */
export function useTasks(filters: TaskFilters = {}) {
  const {
    status,
    assignee,
    priority,
    search,
    page = 1,
    pageSize = 10,
  } = filters

  return useQuery<TasksListResponse>({
    queryKey: taskKeys.list({
      status,
      assignee,
      priority,
      search,
      page,
      pageSize,
    }),
    queryFn: async () => {
      const params = new URLSearchParams()

      if (status) params.append('status', status)
      if (priority) params.append('priority', priority)
      if (search) params.append('search', search)
      if (assignee) params.append('assignee', assignee)
      params.append('pageIndex', String(page - 1))
      params.append('pageSize', String(pageSize))

      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      const totalPages = Math.ceil(data.total / pageSize)

      return {
        ...data,
        page,
        pageSize,
        totalPages,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

/**
 * Fetch a single task by ID.
 * @param id - The task ID to fetch
 * @returns Single Task object with loading and error states
 */
export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch task ${id}`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!id,
  })
}
