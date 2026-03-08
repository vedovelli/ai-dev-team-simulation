import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Task, TaskStatus, TaskPriority } from '../types/task'

/**
 * Advanced filtering state for tasks with date range support
 */
export interface AdvancedTaskFilterState {
  priority: TaskPriority | null
  status: TaskStatus[] // Multi-select
  assignee: string | null
  search: string
  dateFrom: string | null
  dateTo: string | null
  page: number
  pageSize: number
}

/**
 * Optimized query response for filtered tasks
 */
export interface FilteredTasksResponse {
  data: Task[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  filterHash: string
}

/**
 * Hook options
 */
export interface UseAdvancedTaskFiltersOptions {
  searchDebounceMs?: number
  staleTime?: number
  gcTime?: number
  keepPreviousData?: boolean
}

/**
 * Advanced task filtering hook with optimized query patterns
 *
 * Features:
 * - Manages filter state: priority (single), status (multi), assignee, date range
 * - Debounced text search (default 300ms)
 * - Optimized TanStack Query integration with keepPreviousData
 * - Stale-while-revalidate pattern (staleTime: 30s, gcTime: 5min)
 * - Exponential backoff retry logic
 * - Filter hash for stable query key generation
 *
 * @example
 * const filters = useAdvancedTaskFilters()
 *
 * const { data, isLoading } = useQuery({
 *   queryKey: filters.queryKey,
 *   queryFn: () => fetchFilteredTasks(filters.state),
 *   staleTime: filters.options.staleTime,
 *   gcTime: filters.options.gcTime,
 *   keepPreviousData: true,
 * })
 *
 * return (
 *   <>
 *     <input
 *       value={filters.localSearch}
 *       onChange={(e) => filters.setLocalSearch(e.target.value)}
 *       placeholder="Search tasks..."
 *     />
 *     {/* render filters */}
 *   </>
 * )
 */
export function useAdvancedTaskFilters(
  options: UseAdvancedTaskFiltersOptions = {}
) {
  const {
    searchDebounceMs = 300,
    staleTime = 30 * 1000, // 30 seconds
    gcTime = 5 * 60 * 1000, // 5 minutes
    keepPreviousData = true,
  } = options

  // Filter state
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [status, setStatus] = useState<TaskStatus[]>([])
  const [assignee, setAssignee] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Debounce search with cleanup
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(localSearch)
      // Reset to page 1 when search changes
      if (localSearch !== debouncedSearch) {
        setPage(1)
      }
    }, searchDebounceMs)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [localSearch, searchDebounceMs, debouncedSearch])

  /**
   * Generate stable filter hash for query key
   */
  const filterHash = useMemo(() => {
    const filterObj = {
      priority,
      status: status.sort(), // Stable ordering
      assignee,
      search: debouncedSearch,
      dateFrom,
      dateTo,
    }
    return btoa(JSON.stringify(filterObj))
  }, [priority, status, assignee, debouncedSearch, dateFrom, dateTo])

  /**
   * Optimized query key structure
   * Follows TanStack Query best practices
   */
  const queryKey = useMemo(() => {
    return ['tasks', 'filtered', filterHash, page, pageSize] as const
  }, [filterHash, page, pageSize])

  /**
   * Current filter state
   */
  const state: AdvancedTaskFilterState = useMemo(
    () => ({
      priority,
      status,
      assignee,
      search: debouncedSearch,
      dateFrom,
      dateTo,
      page,
      pageSize,
    }),
    [priority, status, assignee, debouncedSearch, dateFrom, dateTo, page, pageSize]
  )

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      priority !== null ||
      status.length > 0 ||
      assignee !== null ||
      debouncedSearch.length > 0 ||
      dateFrom !== null ||
      dateTo !== null
    )
  }, [priority, status, assignee, debouncedSearch, dateFrom, dateTo])

  /**
   * Count active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (priority !== null) count++
    if (status.length > 0) count += status.length
    if (assignee !== null) count++
    if (debouncedSearch.length > 0) count++
    if (dateFrom !== null) count++
    if (dateTo !== null) count++
    return count
  }, [priority, status, assignee, debouncedSearch, dateFrom, dateTo])

  /**
   * Clear all filters and reset to page 1
   */
  const clearAllFilters = useCallback(() => {
    setPriority(null)
    setStatus([])
    setAssignee(null)
    setLocalSearch('')
    setDebouncedSearch('')
    setDateFrom(null)
    setDateTo(null)
    setPage(1)
  }, [])

  /**
   * Reset pagination to page 1 when filters change
   */
  const resetPagination = useCallback(() => {
    setPage(1)
  }, [])

  /**
   * Update single priority filter
   */
  const setPriorityFilter = useCallback((p: TaskPriority | null) => {
    setPriority(p)
    resetPagination()
  }, [resetPagination])

  /**
   * Update multi-select status filter
   */
  const setStatusFilter = useCallback((s: TaskStatus[]) => {
    setStatus(s)
    resetPagination()
  }, [resetPagination])

  /**
   * Update assignee filter (searchable)
   */
  const setAssigneeFilter = useCallback((a: string | null) => {
    setAssignee(a)
    resetPagination()
  }, [resetPagination])

  /**
   * Update search text (debounced automatically)
   */
  const setSearchFilter = useCallback((s: string) => {
    setLocalSearch(s)
  }, [])

  /**
   * Update date range filter
   */
  const setDateRangeFilter = useCallback(
    (from: string | null, to: string | null) => {
      setDateFrom(from)
      setDateTo(to)
      resetPagination()
    },
    [resetPagination]
  )

  /**
   * Toggle status in multi-select
   */
  const toggleStatus = useCallback(
    (s: TaskStatus) => {
      setStatus((prev) => {
        const updated = prev.includes(s)
          ? prev.filter((st) => st !== s)
          : [...prev, s]
        return updated
      })
      resetPagination()
    },
    [resetPagination]
  )

  return {
    // Current state
    state,
    queryKey,
    filterHash,

    // Filter values (for UI bindings)
    priority,
    status,
    assignee,
    localSearch,
    debouncedSearch,
    dateFrom,
    dateTo,
    page,
    pageSize,

    // Filter setters
    setPriorityFilter,
    setStatusFilter,
    setAssigneeFilter,
    setSearchFilter,
    setDateRangeFilter,
    toggleStatus,
    clearAllFilters,
    resetPagination,

    // Pagination
    setPage,
    setPageSize,

    // Filter metadata
    hasActiveFilters,
    activeFilterCount,

    // Query options for use with useQuery
    queryOptions: {
      staleTime,
      gcTime,
      keepPreviousData,
      retry: (failureCount: number) => {
        // Exponential backoff: 1s, 2s, 4s, then stop
        return failureCount < 3
      },
    },
  }
}
