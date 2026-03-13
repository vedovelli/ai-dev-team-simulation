/**
 * useTaskSearch Hook
 *
 * Implements advanced task search with:
 * - Debounced query string (300ms)
 * - Dependent query that only fires when search term ≥ 2 chars OR filters are set
 * - Multi-field filtering and sorting
 * - Pagination support
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useDeferredValue, useCallback } from 'react'
import type { Task } from '../types/task'
import type { TaskSearchParams, TaskSearchResult, UseTaskSearchReturn } from '../types/task-search'

interface UseTaskSearchOptions extends Omit<UseQueryOptions<TaskSearchResult>, 'queryKey' | 'queryFn'> {
  params: TaskSearchParams
}

/**
 * Custom hook for task search with debouncing and dependent queries
 *
 * @param options - Query options including search parameters
 * @returns Search results with loading/error states
 *
 * @example
 * ```tsx
 * const { tasks, isLoading, pageCount } = useTaskSearch({
 *   params: {
 *     q: searchTerm,
 *     status: ['in-progress'],
 *     sortBy: 'createdAt',
 *     sortDir: 'desc',
 *     page: 1,
 *     limit: 20,
 *   },
 * })
 * ```
 */
export function useTaskSearch(options: UseTaskSearchOptions): UseTaskSearchReturn {
  const { params, ...queryOptions } = options

  // Debounce the search query string
  const deferredQuery = useDeferredValue(params.q || '')

  // Determine if search should execute (dependent query)
  const shouldSearch = useCallback(() => {
    const hasValidSearch = deferredQuery && deferredQuery.length >= 2
    const hasFilters =
      (params.status && params.status.length > 0) ||
      params.assigneeId ||
      params.priority ||
      params.sprintId ||
      params.dateFrom ||
      params.dateTo

    return hasValidSearch || hasFilters
  }, [deferredQuery, params])

  // Stable query key with params
  const queryKey = [
    'tasks',
    'search',
    {
      q: deferredQuery,
      status: params.status,
      assigneeId: params.assigneeId,
      priority: params.priority,
      sprintId: params.sprintId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      page: params.page,
      limit: params.limit,
    },
  ] as const

  const query = useQuery<TaskSearchResult>({
    ...queryOptions,
    queryKey,
    queryFn: async () => {
      if (!shouldSearch()) {
        // Return empty results if search criteria not met
        return {
          data: [],
          meta: {
            total: 0,
            page: 1,
            pageSize: params.limit || 20,
            pageCount: 0,
          },
        }
      }

      const searchParams = new URLSearchParams()

      if (deferredQuery) {
        searchParams.set('q', deferredQuery)
      }

      if (params.status && params.status.length > 0) {
        params.status.forEach((s) => searchParams.append('status', s))
      }

      if (params.assigneeId) {
        searchParams.set('assigneeId', params.assigneeId)
      }

      if (params.priority) {
        searchParams.set('priority', params.priority)
      }

      if (params.sprintId) {
        searchParams.set('sprintId', params.sprintId)
      }

      if (params.dateFrom) {
        searchParams.set('dateFrom', params.dateFrom)
      }

      if (params.dateTo) {
        searchParams.set('dateTo', params.dateTo)
      }

      if (params.sortBy) {
        searchParams.set('sortBy', String(params.sortBy))
      }

      if (params.sortDir) {
        searchParams.set('sortDir', params.sortDir)
      }

      searchParams.set('page', String(params.page || 1))
      searchParams.set('limit', String(params.limit || 20))

      const response = await fetch(`/api/tasks/search?${searchParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch task search results')
      }

      return response.json()
    },
    staleTime: 30000, // 30 seconds
    gcTime: 2 * 60000, // 2 minutes
    enabled: shouldSearch(),
    retry: 3,
  })

  return {
    tasks: query.data?.data ?? [],
    totalCount: query.data?.meta.total ?? 0,
    pageCount: query.data?.meta.pageCount ?? 0,
    isLoading: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
  }
}
