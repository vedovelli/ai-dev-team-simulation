import { useMemo, useState } from 'react'

export interface ColumnConfig<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any) => React.ReactNode
}

export interface UseTableState<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  sortKey?: keyof T
  sortDirection: 'asc' | 'desc'
  searchTerm: string
  isLoading?: boolean
}

export interface UseTableReturn<T> {
  displayedData: T[]
  sortedAndFilteredData: T[]
  columns: ColumnConfig<T>[]
  sortKey?: keyof T
  sortDirection: 'asc' | 'desc'
  searchTerm: string
  isLoading: boolean
  setSortKey: (key: keyof T) => void
  toggleSort: (key: keyof T) => void
  setSearchTerm: (term: string) => void
  getSortIcon: (key: keyof T) => '↑' | '↓' | null
}

/**
 * Custom hook for managing simple table operations (sort, filter)
 * Provides 80% of TanStack Table's value with minimal complexity
 *
 * @param data - Array of row data
 * @param columns - Column configuration
 * @param isLoading - Optional loading state
 * @returns Table state and control functions
 */
export function useTable<T extends object>({
  data,
  columns,
  sortKey: initialSortKey,
  sortDirection: initialSortDirection = 'asc',
  searchTerm: initialSearchTerm = '',
  isLoading = false,
}: UseTableState<T>): UseTableReturn<T> {
  const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSortKey)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    initialSortDirection
  )
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const lowerSearchTerm = searchTerm.toLowerCase()

    return data.filter((row) => {
      return columns.some((col) => {
        // Only search in filterable columns
        if (col.filterable === false) return false

        const value = row[col.key]
        if (value === null || value === undefined) return false

        return String(value).toLowerCase().includes(lowerSearchTerm)
      })
    })
  }, [data, columns, searchTerm])

  // Sort data
  const sortedAndFilteredData = useMemo(() => {
    if (!sortKey) return filteredData

    const column = columns.find((col) => col.key === sortKey)
    if (!column || column.sortable === false) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }

      // Fallback to string comparison
      const aStr = String(aValue)
      const bStr = String(bValue)
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })

    return sorted
  }, [filteredData, sortKey, sortDirection, columns])

  const toggleSort = (key: keyof T) => {
    const column = columns.find((col) => col.key === key)
    if (column?.sortable === false) return

    if (sortKey === key) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new sort key with ascending direction
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (key: keyof T): '↑' | '↓' | null => {
    if (sortKey !== key) return null
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return {
    displayedData: sortedAndFilteredData,
    sortedAndFilteredData,
    columns,
    sortKey,
    sortDirection,
    searchTerm,
    isLoading,
    setSortKey,
    toggleSort,
    setSearchTerm,
    getSortIcon,
  }
}
