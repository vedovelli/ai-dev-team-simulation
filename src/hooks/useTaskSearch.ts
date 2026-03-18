import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SearchFilters, SearchResult, UseTaskSearchOptions, UseTaskSearchReturn } from '../types/search'

/**
 * Query key factory for task search
 */
export const taskSearchQueryKeys = {
  all: ['tasks', 'search'] as const,
  search: (filters: SearchFilters, page: number) =>
    [...taskSearchQueryKeys.all, { filters, page }] as const,
}

/**
 * Global task search hook with debounced query and filter state management
 *
 * Features:
 * - Full-text search across task titles and descriptions
 * - Multi-filter support (status, priority, agent, sprint, date range)
 * - Debounced query input (default 300ms) to avoid excessive requests
 * - Pagination with computed totalPages
 * - Stale-while-revalidate strategy (30s stale, 2min gc)
 * - Exponential backoff retry (3 attempts)
 * - keepPreviousData to prevent UI flashing
 *
 * @param options Configuration for search behavior
 * @returns Search state and actions
 *
 * @example
 * ```tsx
 * const search = useTaskSearch()
 *
 * // Update search query (debounced)
 * search.setQuery('authentication')
 *
 * // Update filters
 * search.setFilters({
 *   status: ['in-progress', 'in-review'],
 *   priority: ['high'],
 * })
 *
 * // Navigate pages
 * search.setPage(2)
 *
 * // Get results
 * const { results, isLoading, total } = search
 * ```
 */
export function useTaskSearch(options: UseTaskSearchOptions = {}): UseTaskSearchReturn {
  const {
    debounceMs = 300,
    pageSize = 20,
    staleTime = 30 * 1000, // 30s
  } = options

  const queryClient = useQueryClient()

  // Internal state for debouncing
  const [query, setQueryState] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFiltersState] = useState<SearchFilters>({})
  const [page, setPageState] = useState(1)

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      // Reset to page 1 when query changes
      setPageState(1)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Reset page when filters change
  useEffect(() => {
    setPageState(1)
  }, [filters])

  // Perform search query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: taskSearchQueryKeys.search(
      {
        ...filters,
        query: debouncedQuery,
      },
      page
    ),
    queryFn: async () => {
      const response = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            ...filters,
            query: debouncedQuery,
          },
          page,
          pageSize,
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      return response.json()
    },
    staleTime,
    gcTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Public API methods
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
  }, [])

  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters)
  }, [])

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, newPage))
  }, [])

  const reset = useCallback(() => {
    setQueryState('')
    setDebouncedQuery('')
    setFiltersState({})
    setPageState(1)
    queryClient.removeQueries({
      queryKey: taskSearchQueryKeys.all,
    })
  }, [queryClient])

  return {
    // Query state
    results: data?.items ?? [],
    isLoading,
    isError,
    error: error instanceof Error ? error : null,

    // Pagination
    page,
    pageSize,
    total: data?.pagination.total ?? 0,
    totalPages: data?.pagination.totalPages ?? 0,

    // Filter state
    filters,
    debouncedQuery,

    // Actions
    setQuery,
    setFilters,
    setPage,
    reset,
  }
}

export type UseTaskSearchReturnType = ReturnType<typeof useTaskSearch>
