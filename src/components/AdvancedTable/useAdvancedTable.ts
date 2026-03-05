import { useAdvancedTableState } from './useAdvancedTableState'
import { useAdvancedTableQuery, type TableData } from './useAdvancedTableQuery'
import { SortingState } from '@tanstack/react-table'

interface UseAdvancedTableOptions {
  endpoint: string
  initialPageIndex?: number
  initialPageSize?: number
  initialSorting?: SortingState
  filters?: Record<string, string | number | boolean | undefined>
  enabled?: boolean
}

interface UseAdvancedTableResult<T> {
  // State
  pageIndex: number
  pageSize: number
  sorting: SortingState
  setPageIndex: (index: number) => void
  setPageSize: (size: number) => void
  setSorting: (sorting: SortingState) => void
  resetState: () => void
  // Data
  data: TableData<T>
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Custom hook combining useAdvancedTableState and useAdvancedTableQuery
 * Provides a clean interface for server-side pagination, sorting, and filtering
 *
 * @param endpoint - API endpoint to fetch data from
 * @param options - Configuration options
 * @returns Object with state management and data fetching
 *
 * @example
 * ```tsx
 * const table = useAdvancedTable<User>('/api/users', {
 *   initialPageSize: 25,
 *   filters: { status: 'active' }
 * })
 *
 * return <AdvancedTable
 *   data={table.data.data}
 *   total={table.data.total}
 *   pageIndex={table.pageIndex}
 *   pageSize={table.pageSize}
 *   sorting={table.sorting}
 *   onPageIndexChange={table.setPageIndex}
 *   onPageSizeChange={table.setPageSize}
 *   onSortingChange={table.setSorting}
 *   isLoading={table.isLoading}
 *   isError={table.isError}
 *   columns={columns}
 * />
 * ```
 */
export function useAdvancedTable<T extends Record<string, unknown>>(
  endpoint: string,
  options: UseAdvancedTableOptions = {}
): UseAdvancedTableResult<T> {
  const {
    initialPageIndex,
    initialPageSize,
    initialSorting,
    filters = {},
    enabled = true,
  } = options

  // State management
  const tableState = useAdvancedTableState({
    initialPageIndex,
    initialPageSize,
    initialSorting,
  })

  // Data fetching
  const query = useAdvancedTableQuery<T>(endpoint, {
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    sorting: tableState.sorting,
    filters,
    enabled,
  })

  return {
    // State
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    sorting: tableState.sorting,
    setPageIndex: tableState.setPageIndex,
    setPageSize: tableState.setPageSize,
    setSorting: tableState.setSorting,
    resetState: tableState.resetState,
    // Data
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
