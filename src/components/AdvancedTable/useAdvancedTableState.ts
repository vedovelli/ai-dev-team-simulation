import { useState, useCallback } from 'react'
import { SortingState } from '@tanstack/react-table'

interface UseAdvancedTableStateOptions {
  initialPageIndex?: number
  initialPageSize?: number
  initialSorting?: SortingState
}

interface UseAdvancedTableStateResult {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  setPageIndex: (index: number) => void
  setPageSize: (size: number) => void
  setSorting: (sorting: SortingState) => void
  resetState: () => void
}

export function useAdvancedTableState(
  options: UseAdvancedTableStateOptions = {}
): UseAdvancedTableStateResult {
  const {
    initialPageIndex = 0,
    initialPageSize = 25,
    initialSorting = [],
  } = options

  const [pageIndex, setPageIndex] = useState(initialPageIndex)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sorting, setSorting] = useState<SortingState>(initialSorting)

  const resetState = useCallback(() => {
    setPageIndex(initialPageIndex)
    setPageSize(initialPageSize)
    setSorting(initialSorting)
  }, [initialPageIndex, initialPageSize, initialSorting])

  return {
    pageIndex,
    pageSize,
    sorting,
    setPageIndex,
    setPageSize,
    setSorting,
    resetState,
  }
}
