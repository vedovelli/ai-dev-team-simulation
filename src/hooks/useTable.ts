import { useState, useMemo, useCallback } from 'react'

export interface UseTableOptions<T> {
  data: T[]
  initialSortKey?: keyof T
  initialSortOrder?: 'asc' | 'desc'
}

export interface UseTableReturn<T> {
  sortedAndFilteredData: T[]
  sortKey: keyof T | null
  sortOrder: 'asc' | 'desc'
  filterValue: string
  handleSort: (key: keyof T) => void
  handleFilter: (value: string) => void
  clearFilters: () => void
}

/**
 * Custom hook for managing table state with client-side sorting and filtering.
 * Provides a simple API for sorting by column and filtering across all columns.
 *
 * @template T - The type of data in the table
 * @param options - Configuration for the hook
 * @returns Table state and handlers
 *
 * @example
 * ```tsx
 * const { sortedAndFilteredData, sortKey, sortOrder, handleSort, handleFilter } = useTable({
 *   data: users,
 *   initialSortKey: 'name',
 * })
 * ```
 */
export function useTable<T extends Record<string, any>>({
  data,
  initialSortKey,
  initialSortOrder = 'asc',
}: UseTableOptions<T>): UseTableReturn<T> {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey ?? null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)
  const [filterValue, setFilterValue] = useState('')

  const handleSort = useCallback((key: keyof T) => {
    setSortKey((prevKey) => {
      // If clicking the same column, toggle sort order
      if (prevKey === key) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'))
        return key
      }
      // Reset to ascending when sorting a new column
      setSortOrder('asc')
      return key
    })
  }, [])

  const handleFilter = useCallback((value: string) => {
    setFilterValue(value)
  }, [])

  const clearFilters = useCallback(() => {
    setFilterValue('')
  }, [])

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data]

    // Apply filtering
    if (filterValue) {
      const lowerFilter = filterValue.toLowerCase()
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(lowerFilter)
        )
      )
    }

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]

        // Handle undefined/null values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sortOrder === 'asc' ? 1 : -1
        if (bVal == null) return sortOrder === 'asc' ? -1 : 1

        // Handle string comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal)
          return sortOrder === 'asc' ? comparison : -comparison
        }

        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
        }

        // Fallback comparison
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, filterValue, sortKey, sortOrder])

  return {
    sortedAndFilteredData,
    sortKey,
    sortOrder,
    filterValue,
    handleSort,
    handleFilter,
    clearFilters,
  }
}
