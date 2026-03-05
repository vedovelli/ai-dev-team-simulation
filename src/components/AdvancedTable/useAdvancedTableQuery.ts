import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { SortingState } from '@tanstack/react-table'

export interface TableData<T> {
  data: T[]
  total: number
  pageIndex: number
  pageSize: number
}

interface UseAdvancedTableQueryOptions {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  filters?: Record<string, string | number | boolean | undefined>
  enabled?: boolean
}

interface UseAdvancedTableQueryResult<T> extends UseQueryResult<TableData<T>> {
  isLoading: boolean
  isError: boolean
  data: TableData<T>
}

export function useAdvancedTableQuery<T extends Record<string, unknown>>(
  endpoint: string,
  options: UseAdvancedTableQueryOptions
): UseAdvancedTableQueryResult<T> {
  const { pageIndex, pageSize, sorting, filters = {}, enabled = true } = options

  // Query key includes stringified filters to properly track changes.
  // Even if the filters object reference changes, JSON.stringify ensures
  // that React Query detects actual filter value changes and re-fetches data
  const queryKey = [
    endpoint,
    pageIndex,
    pageSize,
    sorting,
    JSON.stringify(filters),
  ]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('pageIndex', pageIndex.toString())
      params.append('pageSize', pageSize.toString())

      // Add sorting parameters
      if (sorting.length > 0) {
        const [sort] = sorting
        params.append('sortBy', sort.id)
        params.append('sortOrder', sort.desc ? 'desc' : 'asc')
      }

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`${endpoint}?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      const result: TableData<T> = await response.json()
      return result
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    ...query,
    isLoading: query.isPending,
    isError: query.isError,
    data: query.data || { data: [], total: 0, pageIndex, pageSize },
  } as UseAdvancedTableQueryResult<T>
}
