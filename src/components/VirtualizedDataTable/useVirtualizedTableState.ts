import { useState, useCallback } from 'react'

export interface VirtualizedTableState {
  globalFilter: string
  columnVisibility: Record<string, boolean>
  selectedRowIndex: number | null
}

interface UseVirtualizedTableStateOptions {
  initialColumnVisibility?: Record<string, boolean>
}

export function useVirtualizedTableState(
  options: UseVirtualizedTableStateOptions = {}
) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    options.initialColumnVisibility || {}
  )
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value)
  }, [])

  const handleColumnVisibilityChange = useCallback(
    (visibility: Record<string, boolean>) => {
      setColumnVisibility(visibility)
    },
    []
  )

  const handleRowSelection = useCallback((index: number | null) => {
    setSelectedRowIndex(index)
  }, [])

  const resetState = useCallback(() => {
    setGlobalFilter('')
    setColumnVisibility(options.initialColumnVisibility || {})
    setSelectedRowIndex(null)
  }, [options.initialColumnVisibility])

  return {
    globalFilter,
    columnVisibility,
    selectedRowIndex,
    setGlobalFilter: handleGlobalFilterChange,
    setColumnVisibility: handleColumnVisibilityChange,
    setSelectedRowIndex: handleRowSelection,
    resetState,
  }
}
