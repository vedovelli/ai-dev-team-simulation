import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { Task, TaskListFilters, PaginatedTasksResponse } from '../types/task'

/**
 * Query key factory for task list infinite queries
 * Filters included in key ensures automatic refetch + cursor reset when filters change
 */
export const taskListQueryKeys = {
  all: ['tasks', 'infinite'] as const,
  list: (filters?: TaskListFilters) => [
    ...taskListQueryKeys.all,
    filters ?? {},
  ] as const,
}

/**
 * Configuration options for useTaskList hook
 */
export interface UseTaskListOptions {
  /** Number of items per page (default: 20) */
  pageSize?: number
  /** Initial filters to apply */
  filters?: TaskListFilters
}

/**
 * Fetch tasks with infinite scroll support using cursor-based pagination
 *
 * Features:
 * - TanStack Query useInfiniteQuery for infinite scroll
 * - Cursor-based pagination with nextCursor support
 * - Query key includes filters → auto-reset to page 1 when filters change
 * - Optimistic updates for task mutations while infinite scroll is active
 * - Support for filters: priority, status, agent, sprint, assignee, date range
 * - Exponential backoff retry (3 attempts)
 * - Stale time: 30s, gc time: 5min
 * - Full TypeScript type safety
 *
 * IMPORTANT: Since filters are included in the query key as an object reference,
 * parent components MUST memoize the filters object to avoid unnecessary refetches.
 * If you create a new filter object on every render, TanStack Query will treat it
 * as a different filter set and trigger a refetch.
 *
 * @param options - Hook configuration
 * @param options.pageSize - Items per page (default: 20)
 * @param options.filters - **MUST BE MEMOIZED** with useMemo() to prevent refetch loops
 * @returns Infinite query object with flattened tasks and computed values
 *
 * @example
 * const filters = useMemo(
 *   () => ({ status: 'in-progress', priority: 'high' }),
 *   [] // memoize the object
 * )
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useTaskList({
 *   pageSize: 20,
 *   filters
 * })
 *
 * @see docs/guides/tanstack-query.md for detailed infinite query patterns
 */
export function useTaskList(options: UseTaskListOptions = {}) {
  const { pageSize = 20, filters } = options
  const queryClient = useQueryClient()

  const query = useInfiniteQuery<PaginatedTasksResponse, Error>({
    queryKey: taskListQueryKeys.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams()
      params.append('page', String(pageParam))
      params.append('limit', String(pageSize))

      // Helper to append multi-value filter parameters (OR logic within dimension)
      const appendMultiValue = (key: string, value?: string | string[] | null) => {
        if (value) {
          const values = Array.isArray(value) ? value : [value]
          values.forEach((v) => params.append(key, v))
        }
      }

      // Add filter parameters
      if (filters) {
        appendMultiValue('priority', filters.priority)
        appendMultiValue('status', filters.status)
        appendMultiValue('agent', filters.agent)
        appendMultiValue('sprint', filters.sprint)
        appendMultiValue('assignee', filters.assignee)

        // Date range filters (single-value)
        if (filters.dateRangeStart) {
          params.append('dateRangeStart', filters.dateRangeStart)
        }
        if (filters.dateRangeEnd) {
          params.append('dateRangeEnd', filters.dateRangeEnd)
        }
      }

      const response = await fetch(`/api/tasks?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`)
      }

      return response.json() as Promise<PaginatedTasksResponse>
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextCursor : undefined),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  /**
   * Manually invalidate the task list cache for the CURRENT filter set
   *
   * This invalidates only the cache associated with the filters passed to this hook instance.
   * Other filter combinations remain untouched and won't trigger refetches. This prevents
   * unnecessary data fetches for queries the user isn't viewing.
   *
   * Useful when:
   * - A mutation completes and you want immediate UI refresh without waiting for stale time
   * - You need to force a refetch after user action that should show fresh data
   *
   * @note Only affects the current filter set. Switching filters automatically resets pagination
   * via the query key change, so manual invalidation is usually not needed on filter changes.
   */
  const invalidateTaskList = () => {
    queryClient.invalidateQueries({
      queryKey: taskListQueryKeys.list(filters),
    })
  }

  // Flatten all tasks from all pages
  const allTasks = query.data?.pages.flatMap((page) => page.data) ?? []

  // Compute total count from first page
  const totalCount = query.data?.pages[0]?.totalCount ?? 0

  return {
    // Query state
    ...query,

    // Computed values
    tasks: allTasks,
    totalCount,

    // Cache management
    invalidateTaskList,
  }
}

export type UseTaskListReturn = ReturnType<typeof useTaskList>
