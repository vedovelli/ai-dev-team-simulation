import { useQuery } from '@tanstack/react-query'
import { useRef, useState, useCallback, useEffect } from 'react'
import type {
  TaskSearchResponse,
  TaskSearchFilters,
  UseTaskSearchReturn,
  UseTaskSearchOptions,
} from '../types/task-search'

/**
 * Hook for searching tasks with full-text search and faceted filtering
 *
 * Features:
 * - Full-text search across task titles and descriptions
 * - Debounced query input (300ms default) to reduce API calls
 * - Support for filtering by priority, status, agent, sprint
 * - Facet aggregation showing count per filter option
 * - Pagination with metadata
 * - Stale-while-revalidate strategy (30s stale time)
 * - Exponential backoff retry (3 attempts)
 * - Empty state vs no-query state distinction
 *
 * Query key architecture: ['tasks', 'search', { query, filters, page }]
 *
 * Example usage:
 * ```tsx
 * const search = useTaskSearch()
 *
 * return (
 *   <div>
 *     <input
 *       value={search.debouncedQuery}
 *       onChange={(e) => search.setQuery(e.target.value)}
 *     />
 *     {search.isLoading && <p>Loading...</p>}
 *     {search.hasSearchQuery && search.results.length === 0 && (
 *       <p>No tasks match "{search.debouncedQuery}"</p>
 *     )}
 *     {search.results.map(task => (
 *       <TaskItem key={task.id} task={task} />
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useTaskSearch(options: UseTaskSearchOptions = {}): UseTaskSearchReturn {
  const { debounceMs = 300, perPage = 20, staleTime = 30 * 1000 } = options

  const [query, setQueryImmediate] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFilters] = useState<TaskSearchFilters>({})
  const [page, setPage] = useState(1)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce query input
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryImmediate(newQuery)

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(newQuery)
        setPage(1) // Reset to page 1 on new search
      }, debounceMs)
    },
    [debounceMs]
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Build query key with debounced query and filters
  const queryKey = ['tasks', 'search', { query: debouncedQuery, filters, page }] as const

  // Fetch data only if there's a query or filters are set
  const queryResult = useQuery<TaskSearchResponse, Error>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()

      if (debouncedQuery) {
        params.append('q', debouncedQuery)
      }

      if (filters.priority) {
        params.append('priority', filters.priority)
      }

      if (filters.status) {
        params.append('status', filters.status)
      }

      if (filters.assignedAgent) {
        params.append('assignedAgent', filters.assignedAgent)
      }

      if (filters.sprint) {
        params.append('sprint', filters.sprint)
      }

      params.append('page', page.toString())
      params.append('perPage', perPage.toString())

      const response = await fetch(`/api/tasks/search?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to search tasks: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: debouncedQuery.length > 0 || Object.values(filters).some((v) => v !== undefined),
    staleTime,
    gcTime: staleTime * 2, // Keep in cache for 2x stale time
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Memoize setFilters to maintain referential equality for consumer dependencies
  const memoizedSetFilters = useCallback(
    (newFilters: TaskSearchFilters) => {
      setFilters(newFilters)
      setPage(1) // Reset to page 1 when filters change
    },
    []
  )

  return {
    results: queryResult.data?.results || [],
    facets: queryResult.data?.facets || {
      priority: { low: 0, medium: 0, high: 0 },
      status: { backlog: 0, 'in-progress': 0, 'in-review': 0, done: 0 },
      assignedAgent: {},
      sprint: {},
    },
    pagination: queryResult.data?.pagination || {
      page,
      perPage,
      total: 0,
      totalPages: 0,
    },
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    hasSearchQuery: debouncedQuery.length > 0,
    debouncedQuery,
    setQuery,
    setFilters: memoizedSetFilters,
    setPage,
  }
}
