import { useEffect, useState, useCallback } from 'react'
import { SortingState, ColumnFiltersState } from '@tanstack/react-table'

interface UseDataTableQueryProps<T> {
  endpoint: string
  pageIndex: number
  pageSize: number
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  enabled?: boolean
  onSuccess?: (data: T[]) => void
  onError?: (error: Error) => void
}

interface UseDataTableQueryReturn<T> {
  data: T[]
  total: number
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useDataTableQuery<T extends Record<string, unknown>>({
  endpoint,
  pageIndex,
  pageSize,
  sorting = [],
  columnFilters = [],
  enabled = true,
  onSuccess,
  onError,
}: UseDataTableQueryProps<T>): UseDataTableQueryReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setIsError(false)
    setError(null)

    try {
      const params = new URLSearchParams({
        pageIndex: String(pageIndex),
        pageSize: String(pageSize),
      })

      // Add sorting parameters
      if (sorting.length > 0) {
        const [sort] = sorting
        params.append('sortBy', sort.id)
        params.append('sortOrder', sort.desc ? 'desc' : 'asc')
      }

      // Add filter parameters
      for (const filter of columnFilters) {
        if (filter.value !== undefined && filter.value !== '') {
          params.append(filter.id, String(filter.value))
        }
      }

      const response = await fetch(`${endpoint}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result.data || [])
      setTotal(result.total || 0)

      if (onSuccess) {
        onSuccess(result.data || [])
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setIsError(true)

      if (onError) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, pageIndex, pageSize, sorting, columnFilters, enabled, onSuccess, onError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    total,
    isLoading,
    isError,
    error,
  }
}
