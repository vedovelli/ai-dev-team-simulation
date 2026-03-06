import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ColumnFiltersState, SortingState } from '@tanstack/react-table'

/**
 * Complete table state shape for URL persistence
 */
export interface TableURLState {
  sort?: { column: string; direction: 'asc' | 'desc' }[]
  filters?: Record<string, string>
  page?: number
  pageSize?: number
  selectedRows?: string[]
}

/**
 * Serializes table state to URL-safe format
 */
export function serializeTableState(state: TableURLState): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  // Serialize sorting
  if (state.sort && state.sort.length > 0) {
    result.sort = state.sort.map((s) => `${s.column}:${s.direction}`).join(',')
  }

  // Serialize filters
  if (state.filters && Object.keys(state.filters).length > 0) {
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value) {
        result[`filter_${key}`] = value
      }
    })
  }

  // Serialize pagination
  if (state.page !== undefined && state.page > 0) {
    result.page = state.page
  }
  if (state.pageSize !== undefined && state.pageSize > 0) {
    result.pageSize = state.pageSize
  }

  // Serialize selected rows
  if (state.selectedRows && state.selectedRows.length > 0) {
    result.selectedRows = state.selectedRows.join(',')
  }

  return result
}

/**
 * Deserializes table state from URL params
 */
export function deserializeTableState(params: Record<string, unknown>): TableURLState {
  const state: TableURLState = {}

  // Deserialize sorting
  const sortParam = typeof params.sort === 'string' ? params.sort : null
  if (sortParam) {
    state.sort = sortParam.split(',').map((s) => {
      const [column, direction] = s.split(':')
      return {
        column,
        direction: (direction as 'asc' | 'desc') || 'asc',
      }
    })
  }

  // Deserialize filters
  const filters: Record<string, string> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (key.startsWith('filter_') && typeof value === 'string') {
      const filterKey = key.replace('filter_', '')
      filters[filterKey] = value
    }
  })
  if (Object.keys(filters).length > 0) {
    state.filters = filters
  }

  // Deserialize pagination
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : typeof params.page === 'number' ? params.page : undefined
  if (page !== undefined && page > 0) {
    state.page = page
  }

  const pageSize = typeof params.pageSize === 'string' ? parseInt(params.pageSize, 10) : typeof params.pageSize === 'number' ? params.pageSize : undefined
  if (pageSize !== undefined && pageSize > 0) {
    state.pageSize = pageSize
  }

  // Deserialize selected rows
  const selectedRowsParam = typeof params.selectedRows === 'string' ? params.selectedRows : null
  if (selectedRowsParam) {
    state.selectedRows = selectedRowsParam.split(',').filter((id) => id)
  }

  return state
}

/**
 * Hook for syncing table state with URL query parameters
 * Provides a complete solution for:
 * - Sorting persistence
 * - Filter persistence
 * - Pagination persistence
 * - Row selection persistence (optional)
 *
 * Features:
 * - Full browser back/forward support
 * - Shareable URLs with complete table state
 * - Type-safe serialization/deserialization
 * - Validation of URL params before application
 */
export function useTableState(initialState?: TableURLState) {
  const navigate = useNavigate()
  const searchParams = useSearch() as Record<string, unknown>

  // Deserialize state from URL
  const state = useMemo(() => {
    const urlState = deserializeTableState(searchParams)
    return {
      sort: urlState.sort || initialState?.sort || [],
      filters: urlState.filters || initialState?.filters || {},
      page: urlState.page || initialState?.page || 1,
      pageSize: urlState.pageSize || initialState?.pageSize || 10,
      selectedRows: urlState.selectedRows || initialState?.selectedRows || [],
    }
  }, [searchParams, initialState])

  // Convert table state to TanStack Table format
  const sorting = useMemo<SortingState>(() => {
    return state.sort.map((s) => ({
      id: s.column,
      desc: s.direction === 'desc',
    }))
  }, [state.sort])

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    return Object.entries(state.filters).map(([id, value]) => ({
      id,
      value,
    }))
  }, [state.filters])

  // Update handlers with debouncing consideration
  const setSorting = useCallback(
    (newSorting: SortingState | ((prev: SortingState) => SortingState)) => {
      const updated = typeof newSorting === 'function' ? newSorting(sorting) : newSorting

      const sort = updated.length > 0
        ? updated.map((s) => ({
            column: s.id,
            direction: (s.desc ? 'desc' : 'asc') as 'asc' | 'desc',
          }))
        : []

      navigate({
        search: {
          ...searchParams,
          ...serializeTableState({
            ...state,
            sort,
          }),
        },
      })
    },
    [navigate, searchParams, state, sorting]
  )

  const setColumnFilters = useCallback(
    (newFilters: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      const updated = typeof newFilters === 'function' ? newFilters(columnFilters) : newFilters

      const filters: Record<string, string> = {}
      updated.forEach((filter) => {
        filters[filter.id] = String(filter.value)
      })

      navigate({
        search: {
          ...searchParams,
          ...serializeTableState({
            ...state,
            filters,
          }),
        },
      })
    },
    [navigate, searchParams, state, columnFilters]
  )

  const setPage = useCallback(
    (page: number) => {
      if (page < 1) return

      navigate({
        search: {
          ...searchParams,
          ...serializeTableState({
            ...state,
            page,
          }),
        },
      })
    },
    [navigate, searchParams, state]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      if (pageSize < 1) return

      navigate({
        search: {
          ...searchParams,
          ...serializeTableState({
            ...state,
            pageSize,
            page: 1, // Reset to first page when changing page size
          }),
        },
      })
    },
    [navigate, searchParams, state]
  )

  const setSelectedRows = useCallback(
    (rowIds: string[]) => {
      navigate({
        search: {
          ...searchParams,
          ...serializeTableState({
            ...state,
            selectedRows: rowIds,
          }),
        },
      })
    },
    [navigate, searchParams, state]
  )

  const clearAllState = useCallback(() => {
    navigate({
      search: {},
    })
  }, [navigate])

  const clearFilters = useCallback(() => {
    navigate({
      search: {
        ...searchParams,
        ...serializeTableState({
          ...state,
          filters: {},
        }),
      },
    })
  }, [navigate, searchParams, state])

  const clearSorting = useCallback(() => {
    navigate({
      search: {
        ...searchParams,
        ...serializeTableState({
          ...state,
          sort: [],
        }),
      },
    })
  }, [navigate, searchParams, state])

  return {
    // Raw state
    state,

    // TanStack Table compatible state
    sorting,
    columnFilters,
    page: state.page,
    pageSize: state.pageSize,
    selectedRows: state.selectedRows,

    // Update handlers
    setSorting,
    setColumnFilters,
    setPage,
    setPageSize,
    setSelectedRows,

    // Clear handlers
    clearAllState,
    clearFilters,
    clearSorting,

    // Utilities
    hasActiveFilters: Object.keys(state.filters).length > 0,
    hasActiveSorting: state.sort.length > 0,
    hasActiveState: Object.keys(state.filters).length > 0 || state.sort.length > 0 || (state.selectedRows?.length ?? 0) > 0,
  }
}
