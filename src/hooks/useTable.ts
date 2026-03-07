import { useState, useMemo, useCallback } from 'react'

export interface UseTableOptions<T> {
  data: T[]
  initialSortKey?: keyof T
  initialSortOrder?: 'asc' | 'desc'
  filters?: Record<string, string | null | undefined>
  onFilterChange?: (filters: Record<string, string | null | undefined>) => void
}

export interface UseTableReturn<T> {
  sortedAndFilteredData: T[]
  sortKey: keyof T | null
  sortOrder: 'asc' | 'desc'
  filterValue: string
  filters: Record<string, string | null | undefined>
  handleSort: (key: keyof T) => void
  handleFilter: (value: string) => void
  setFilter: (key: string, value: string | null) => void
  clearFilters: () => void
}

/**
 * Custom hook for managing table state with client-side sorting and advanced filtering.
 * Provides a simple API for sorting by column, text filtering, and advanced field-based filters.
 *
 * @template T - The type of data in the table
 * @param options - Configuration for the hook
 * @returns Table state and handlers
 *
 * @example
 * ```tsx
 * // Basic usage with sorting and text filtering
 * const { sortedAndFilteredData, handleSort, handleFilter } = useTable({
 *   data: users,
 *   initialSortKey: 'name',
 * })
 *
 * // Advanced usage with URL-synced filters
 * const searchParams = useSearch()
 * const { setFilter, filters } = useTable({
 *   data: tasks,
 *   filters: {
 *     status: searchParams.status,
 *     assignee: searchParams.assignee,
 *   },
 *   onFilterChange: (filters) => navigate({ search: filters })
 * })
 * ```
 */
export function useTable<T extends Record<string, any>>({
  data,
  initialSortKey,
  initialSortOrder = 'asc',
  filters = {},
  onFilterChange,
}: UseTableOptions<T>): UseTableReturn<T> {
  const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey ?? null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder)
  const [filterValue, setFilterValue] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string | null | undefined>>(filters)

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

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const updatedFilters = {
        ...appliedFilters,
        [key]: value || undefined,
      }
      setAppliedFilters(updatedFilters)
      onFilterChange?.(updatedFilters)
    },
    [appliedFilters, onFilterChange]
  )

  const clearFilters = useCallback(() => {
    setFilterValue('')
    const clearedFilters: Record<string, undefined> = {}
    Object.keys(appliedFilters).forEach((key) => {
      clearedFilters[key] = undefined
    })
    setAppliedFilters(clearedFilters)
    onFilterChange?.(clearedFilters)
  }, [appliedFilters, onFilterChange])

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data]

    // Apply advanced filters
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = item[key]
          return String(itemValue).toLowerCase() === String(value).toLowerCase()
        })
      }
    })

    // Apply text filtering
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
  }, [data, filterValue, sortKey, sortOrder, appliedFilters])

  return {
    sortedAndFilteredData,
    sortKey,
    sortOrder,
    filterValue,
    filters: appliedFilters,
    handleSort,
    handleFilter,
    setFilter,
    clearFilters,
  }
}
