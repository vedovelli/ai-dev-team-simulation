import { useState, useCallback } from 'react'
import { SortingState, ColumnFiltersState } from '@tanstack/react-table'

interface UseDataTableStateProps {
  initialPageIndex?: number
  initialPageSize?: number
  initialSorting?: SortingState
  initialFilters?: ColumnFiltersState
}

export interface UseDataTableStateReturn {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  columnFilters: ColumnFiltersState
  setPageIndex: (index: number) => void
  setPageSize: (size: number) => void
  setSorting: (sorting: SortingState) => void
  setColumnFilters: (filters: ColumnFiltersState) => void
  resetPagination: () => void
}

export function useDataTableState({
  initialPageIndex = 0,
  initialPageSize = 10,
  initialSorting = [],
  initialFilters = [],
}: UseDataTableStateProps = {}): UseDataTableStateReturn {
  const [pageIndex, setPageIndex] = useState(initialPageIndex)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters)

  const resetPagination = useCallback(() => {
    setPageIndex(0)
  }, [])

  return {
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
    setPageIndex,
    setPageSize,
    setSorting,
    setColumnFilters,
    resetPagination,
  }
}
