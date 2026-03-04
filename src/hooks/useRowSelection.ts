import { useState, useCallback } from 'react'

export interface RowSelectionState {
  selectedRows: Set<string>
  isAllSelected: boolean
}

interface UseRowSelectionOptions {
  onSelectionChange?: (selectedRows: Set<string>) => void
}

export function useRowSelection(options: UseRowSelectionOptions = {}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  const toggleRowSelection = useCallback(
    (rowId: string) => {
      const newSelectedRows = new Set(selectedRows)
      if (newSelectedRows.has(rowId)) {
        newSelectedRows.delete(rowId)
      } else {
        newSelectedRows.add(rowId)
      }
      setSelectedRows(newSelectedRows)
      options.onSelectionChange?.(newSelectedRows)
    },
    [selectedRows, options]
  )

  const toggleSelectAll = useCallback(
    (rowIds: string[]) => {
      let newSelectedRows: Set<string>
      if (isAllSelected) {
        newSelectedRows = new Set()
        setIsAllSelected(false)
      } else {
        newSelectedRows = new Set(rowIds)
        setIsAllSelected(true)
      }
      setSelectedRows(newSelectedRows)
      options.onSelectionChange?.(newSelectedRows)
    },
    [isAllSelected, options]
  )

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set())
    setIsAllSelected(false)
    options.onSelectionChange?.(new Set())
  }, [options])

  return {
    selectedRows,
    isAllSelected,
    toggleRowSelection,
    toggleSelectAll,
    clearSelection,
  }
}
