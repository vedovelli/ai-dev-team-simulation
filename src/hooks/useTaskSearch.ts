import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SearchTask, SearchFacets, TaskSearchPagination } from '../types/task-search'

/**
 * Query key factory for task search (FAB-193)
 */
export const taskSearchQueryKeys = {
  all: ['tasks', 'search'] as const,
  search: (debouncedQuery: string, filter: 'my_overdue' | 'all') =>
    [...taskSearchQueryKeys.all, debouncedQuery, filter] as const,
}

/**
 * Response from simple task search endpoint
 */
interface TaskSearchResponse {
  items: SearchTask[]
  total: number
}

/**
 * Return type for useTaskSearch hook
 */
export interface UseTaskSearchReturn {
  results: SearchTask[]
  total: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  debouncedQuery: string
  filter: 'my_overdue' | 'all'
  setQuery: (query: string) => void
  setFilter: (filter: 'my_overdue' | 'all') => void
}

/**
 * Configuration options for useTaskSearch hook
 */
export interface UseTaskSearchOptions {
  debounceMs?: number
}

/**
 * Global task search hook with debounced query and filter support
 *
 * Features:
 * - Full-text search across task titles, descriptions, and comments
 * - Filter presets: 'my_overdue' (tasks past deadline assigned to current user) or 'all'
 * - Debounced query input (default 300ms) to avoid excessive requests
 * - Stale-while-revalidate strategy (30s stale, 2min gc)
 * - Exponential backoff retry (3 attempts)
 * - Skips query when query is empty
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
 * // Filter to only overdue tasks assigned to you
 * search.setFilter('my_overdue')
 *
 * // Get results
 * const { results, total, isLoading } = search
 * ```
 */
export function useTaskSearch(options: UseTaskSearchOptions = {}): UseTaskSearchReturn {
  const { debounceMs = 300 } = options

  // Internal state for debouncing
  const [query, setQueryState] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilterState] = useState<'my_overdue' | 'all'>('all')

  // Debounce query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Perform search query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: taskSearchQueryKeys.search(debouncedQuery, filter),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedQuery) {
        params.append('q', debouncedQuery)
      }
      params.append('filter', filter)

      const response = await fetch(`/api/tasks/search?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      return response.json() as Promise<TaskSearchResponse>
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    enabled: debouncedQuery.length > 0, // Skip query when empty
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Public API methods
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
  }, [])

  const setFilter = useCallback((newFilter: 'my_overdue' | 'all') => {
    setFilterState(newFilter)
  }, [])

  return {
    results: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    debouncedQuery,
    filter,
    setQuery,
    setFilter,
  }
}

export type UseTaskSearchReturnType = ReturnType<typeof useTaskSearch>
