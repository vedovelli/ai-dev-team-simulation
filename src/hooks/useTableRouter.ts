import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

/**
 * Type-safe query parameter shape for table routing
 */
export interface TableRouterQuery {
  search?: string
  filter?: Record<string, string>
  sort?: string // Format: "field" or "-field" (- prefix for descending)
  page?: number
  limit?: number
}

/**
 * Parses URL query parameters into TableRouterQuery
 * Handles bracket notation like filter[status]=active&filter[priority]=high
 */
export function parseTableQuery(params: Record<string, unknown>): TableRouterQuery {
  const query: TableRouterQuery = {}

  // Parse search
  if (typeof params.search === 'string') {
    query.search = params.search
  }

  // Parse filters with bracket notation
  const filters: Record<string, string> = {}
  Object.entries(params).forEach(([key, value]) => {
    const match = key.match(/^filter\[([^\]]+)\]$/)
    if (match && typeof value === 'string') {
      filters[match[1]] = value
    }
  })
  if (Object.keys(filters).length > 0) {
    query.filter = filters
  }

  // Parse sort
  if (typeof params.sort === 'string') {
    query.sort = params.sort
  }

  // Parse pagination
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : typeof params.page === 'number' ? params.page : undefined
  if (page && page > 0) {
    query.page = page
  }

  const limit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : typeof params.limit === 'number' ? params.limit : undefined
  if (limit && limit > 0) {
    query.limit = limit
  }

  return query
}

/**
 * Serializes TableRouterQuery back to URL params
 */
export function serializeTableQuery(query: TableRouterQuery): Record<string, unknown> {
  const params: Record<string, unknown> = {}

  if (query.search) {
    params.search = query.search
  }

  if (query.filter && Object.keys(query.filter).length > 0) {
    Object.entries(query.filter).forEach(([key, value]) => {
      params[`filter[${key}]`] = value
    })
  }

  if (query.sort) {
    params.sort = query.sort
  }

  if (query.page && query.page > 1) {
    params.page = query.page
  }

  if (query.limit) {
    params.limit = query.limit
  }

  return params
}

/**
 * Configuration for useTableRouter hook
 */
export interface UseTableRouterOptions<TData> {
  /**
   * Query key for TanStack Query
   * @example ['tasks'], ['agents', agentId]
   */
  queryKey: (string | number | undefined)[]

  /**
   * Query function that accepts parsed table query
   */
  queryFn: (query: TableRouterQuery) => Promise<{
    data: TData[]
    meta: {
      total: number
      page: number
      hasMore: boolean
    }
  }>

  /**
   * Debounce delay for search in milliseconds
   * @default 300
   */
  searchDebounce?: number

  /**
   * Default page size
   * @default 10
   */
  defaultLimit?: number
}

/**
 * Hook that bridges table state with TanStack Router and Query
 *
 * Features:
 * - URL-driven state for search, filters, sort, pagination
 * - Debounced search to reduce API calls
 * - Full bookmark/share support
 * - Browser back/forward navigation
 * - Type-safe query parameter parsing
 * - Automatic caching via TanStack Query
 *
 * @example
 * ```tsx
 * const { data, isPending, search, setSearch, setFilter, setSort, page, setPage } = useTableRouter({
 *   queryKey: ['tasks'],
 *   queryFn: async (query) => {
 *     const res = await fetch(`/api/tasks?${new URLSearchParams(...)}`)
 *     return res.json()
 *   }
 * })
 * ```
 */
export function useTableRouter<TData>({
  queryKey,
  queryFn,
  searchDebounce = 300,
  defaultLimit = 10,
}: UseTableRouterOptions<TData>) {
  const navigate = useNavigate()
  const urlParams = useSearch() as Record<string, unknown>

  // Parse current query from URL
  const query = useMemo(() => {
    const parsed = parseTableQuery(urlParams)
    return {
      search: parsed.search || '',
      filter: parsed.filter || {},
      sort: parsed.sort || '',
      page: parsed.page || 1,
      limit: parsed.limit || defaultLimit,
    }
  }, [urlParams, defaultLimit])

  // Debounce timer ref for search
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Fetch data with current query
  const { data, isPending, isError, error } = useQuery({
    queryKey: [...queryKey, query],
    queryFn: () => queryFn(query),
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  })

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Update search term with debouncing
   */
  const setSearch = useCallback(
    (term: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        navigate({
          search: serializeTableQuery({
            search: term || undefined,
            filter: query.filter,
            sort: query.sort || undefined,
            page: 1, // Reset to first page on search
            limit: query.limit,
          }),
        })
      }, searchDebounce)
    },
    [navigate, query, searchDebounce]
  )

  /**
   * Set filter by field
   */
  const setFilter = useCallback(
    (field: string, value: string | null) => {
      const newFilters = { ...query.filter }
      if (value) {
        newFilters[field] = value
      } else {
        delete newFilters[field]
      }

      navigate({
        search: serializeTableQuery({
          search: query.search || undefined,
          filter: Object.keys(newFilters).length > 0 ? newFilters : undefined,
          sort: query.sort || undefined,
          page: 1, // Reset to first page on filter change
          limit: query.limit,
        }),
      })
    },
    [navigate, query]
  )

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback(
    (filters: Record<string, string | null>) => {
      const newFilters: Record<string, string> = {}
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          newFilters[key] = value
        }
      })

      navigate({
        search: serializeTableQuery({
          search: query.search || undefined,
          filter: Object.keys(newFilters).length > 0 ? newFilters : undefined,
          sort: query.sort || undefined,
          page: 1,
          limit: query.limit,
        }),
      })
    },
    [navigate, query]
  )

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    navigate({
      search: serializeTableQuery({
        search: query.search || undefined,
        sort: query.sort || undefined,
        page: 1,
        limit: query.limit,
      }),
    })
  }, [navigate, query])

  /**
   * Set sort field and direction
   * Pass "-fieldName" for descending
   */
  const setSort = useCallback(
    (field: string | null) => {
      navigate({
        search: serializeTableQuery({
          search: query.search || undefined,
          filter: Object.keys(query.filter).length > 0 ? query.filter : undefined,
          sort: field || undefined,
          page: 1,
          limit: query.limit,
        }),
      })
    },
    [navigate, query]
  )

  /**
   * Navigate to specific page
   */
  const setPage = useCallback(
    (page: number) => {
      if (page < 1) return
      navigate({
        search: serializeTableQuery({
          search: query.search || undefined,
          filter: Object.keys(query.filter).length > 0 ? query.filter : undefined,
          sort: query.sort || undefined,
          page: page > 1 ? page : undefined,
          limit: query.limit,
        }),
      })
    },
    [navigate, query]
  )

  /**
   * Change page size and reset to first page
   */
  const setLimit = useCallback(
    (limit: number) => {
      if (limit < 1) return
      navigate({
        search: serializeTableQuery({
          search: query.search || undefined,
          filter: Object.keys(query.filter).length > 0 ? query.filter : undefined,
          sort: query.sort || undefined,
          page: undefined, // Reset to page 1
          limit: limit !== defaultLimit ? limit : undefined,
        }),
      })
    },
    [navigate, query, defaultLimit]
  )

  /**
   * Clear all table state
   */
  const clearState = useCallback(() => {
    navigate({ search: {} })
  }, [navigate])

  // Helper to check if sort is ascending
  const isSortAsc = (field: string): boolean => {
    return query.sort === field
  }

  // Helper to check if sort is descending
  const isSortDesc = (field: string): boolean => {
    return query.sort === `-${field}`
  }

  return {
    // Data
    data: data?.data || [],
    isLoading: isPending,
    isError,
    error,
    meta: data?.meta || { total: 0, page: query.page, hasMore: false },

    // Current state
    query,
    search: query.search,
    filters: query.filter,
    sort: query.sort,
    page: query.page,
    limit: query.limit,

    // Update handlers
    setSearch,
    setFilter,
    setFilters,
    clearFilters,
    setSort,
    setPage,
    setLimit,
    clearState,

    // Helper methods
    isSortAsc,
    isSortDesc,
  }
}
