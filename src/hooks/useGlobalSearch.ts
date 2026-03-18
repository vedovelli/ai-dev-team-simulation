import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type {
  GlobalSearchFilters,
  GlobalSearchResponse,
  UseGlobalSearchOptions,
  UseGlobalSearchReturn,
  GlobalSearchEntityType,
} from '../types/search'

/**
 * Query key factory for global search
 * Ensures consistency across all hooks that access search cache
 */
export const globalSearchQueryKeys = {
  all: ['search'] as const,
  list: (debouncedQuery: string, filters: Omit<GlobalSearchFilters, 'q'>) =>
    [...globalSearchQueryKeys.all, { debouncedQuery, filters }] as const,
}

/**
 * Fetch global search results from API
 */
async function fetchGlobalSearchResults(
  debouncedQuery: string,
  filters: GlobalSearchFilters
): Promise<GlobalSearchResponse> {
  const params = new URLSearchParams()

  if (debouncedQuery) {
    params.append('q', debouncedQuery)
  }

  if (filters.type) {
    params.append('type', filters.type)
  }

  if (filters.status) {
    params.append('status', filters.status)
  }

  const page = filters.page || 1
  const pageSize = filters.pageSize || 20

  params.append('page', page.toString())
  params.append('pageSize', pageSize.toString())

  const response = await fetch(`/api/search?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch search results: ${response.statusText}`)
  }

  return response.json() as Promise<GlobalSearchResponse>
}

/**
 * Global search hook with router integration and debouncing
 *
 * Features:
 * - 300ms debounce on search query to suppress API calls while typing
 * - Query key: `['search', debouncedQuery, filters]`
 * - Stale time: 60s (search results stay fresh briefly)
 * - TanStack Router integration: syncs query params with URL
 * - Browser history/back-forward navigation preserves search state
 * - Pagination support (page, pageSize)
 * - Results include matchedField metadata for highlighting
 *
 * @param options Configuration options
 * @returns Search state and actions
 *
 * @example
 * const search = useGlobalSearch()
 *
 * return (
 *   <>
 *     <input
 *       value={search.query}
 *       onChange={(e) => search.setQuery(e.target.value)}
 *       placeholder="Search tasks, sprints, agents..."
 *     />
 *     <select
 *       value={search.filters.type || ''}
 *       onChange={(e) => search.setFilters({ type: (e.target.value || undefined) as GlobalSearchEntityType | undefined })}
 *     >
 *       <option value="">All Types</option>
 *       <option value="task">Tasks</option>
 *       <option value="sprint">Sprints</option>
 *       <option value="agent">Agents</option>
 *     </select>
 *
 *     {search.isLoading && <div>Loading...</div>}
 *     {search.results.map((result) => (
 *       <div key={`${result.type}-${result.id}`}>
 *         <h3>{result.title}</h3>
 *         {result.matchedField.highlighted && (
 *           <p>{result.matchedField.field}: {result.matchedField.value}</p>
 *         )}
 *       </div>
 *     ))}
 *   </>
 * )
 */
export function useGlobalSearch(options: UseGlobalSearchOptions = {}): UseGlobalSearchReturn {
  const {
    debounceMs = 300,
    pageSize: defaultPageSize = 20,
    staleTime = 60 * 1000, // 60 seconds
  } = options

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Get URL search params from router
  let routerSearchParams: Partial<GlobalSearchFilters> = {}
  try {
    routerSearchParams = useSearch({ from: '__root__' })
  } catch {
    // Router context not available, use empty defaults
  }

  // Local state for query input
  const [localQuery, setLocalQuery] = useState<string>(routerSearchParams.q || '')
  const [debouncedQuery, setDebouncedQuery] = useState<string>(routerSearchParams.q || '')

  // Filter state (initialize from router params)
  const [filters, setFiltersState] = useState<GlobalSearchFilters>({
    type: (routerSearchParams.type as GlobalSearchEntityType | undefined) || undefined,
    status: routerSearchParams.status,
    page: routerSearchParams.page || 1,
    pageSize: routerSearchParams.pageSize || defaultPageSize,
  })

  // Debounce search with cleanup
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(localQuery)

      // Sync to router query params
      if (localQuery || filters.type || filters.status) {
        navigate({
          search: {
            q: localQuery || undefined,
            type: filters.type,
            status: filters.status,
            page: filters.page,
            pageSize: filters.pageSize,
          },
        })
      }
    }, debounceMs)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [localQuery, filters.type, filters.status, filters.page, filters.pageSize, debounceMs, navigate])

  // TanStack Query for fetching search results
  const query = useQuery<GlobalSearchResponse, Error>({
    queryKey: globalSearchQueryKeys.list(debouncedQuery, {
      type: filters.type,
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    queryFn: () =>
      fetchGlobalSearchResults(debouncedQuery, {
        q: debouncedQuery,
        type: filters.type,
        status: filters.status,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    staleTime,
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Only fetch if we have a query or filters
    enabled: !!(debouncedQuery || filters.type || filters.status),
  })

  const setQuery = useCallback((newQuery: string) => {
    setLocalQuery(newQuery)
    // Reset to page 1 on new query
    setFiltersState((prev) => ({ ...prev, page: 1 }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<GlobalSearchFilters>) => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...newFilters }
      // Reset to page 1 if filters change
      if (newFilters.type !== undefined || newFilters.status !== undefined) {
        updated.page = 1
      }
      return updated
    })
  }, [])

  const setPage = useCallback((page: number) => {
    setFiltersState((prev) => ({ ...prev, page: Math.max(1, page) }))
  }, [])

  const reset = useCallback(() => {
    setLocalQuery('')
    setDebouncedQuery('')
    setFiltersState({
      type: undefined,
      status: undefined,
      page: 1,
      pageSize: defaultPageSize,
    })
    navigate({ search: {} })
  }, [navigate, defaultPageSize])

  const results = query.data?.results ?? []
  const totalCount = query.data?.totalCount ?? 0
  const hasMore = query.data?.hasMore ?? false

  return {
    // Query state
    results,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,

    // Pagination
    totalCount,
    hasMore,
    page: filters.page || 1,
    pageSize: filters.pageSize || defaultPageSize,

    // Filter state
    query: localQuery,
    debouncedQuery,
    filters,

    // Actions
    setQuery,
    setFilters,
    setPage,
    reset,
  }
}

export type UseGlobalSearchReturn_Type = UseGlobalSearchReturn
