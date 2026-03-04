import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useState } from 'react'

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UsePaginatedQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<PaginatedResponse<TData>, TError>, 'queryKey' | 'queryFn'> {
  queryKey: (string | number | object)[]
  queryFn: (params: PaginationParams) => Promise<PaginatedResponse<TData>>
  initialPage?: number
  initialPageSize?: number
}

export interface UsePaginatedQueryResult<TData> {
  data: TData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isPending: boolean
  isError: boolean
  error: Error | null
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (pageSize: number) => void
  canNextPage: boolean
  canPreviousPage: boolean
}

/**
 * A wrapper around TanStack Query's useQuery that handles pagination state
 * and provides convenient methods for navigating pages.
 *
 * Usage:
 * ```tsx
 * const {
 *   data,
 *   page,
 *   pageSize,
 *   totalPages,
 *   nextPage,
 *   previousPage,
 *   isPending,
 * } = usePaginatedQuery({
 *   queryKey: ['users'],
 *   queryFn: (params) => fetchUsers(params),
 *   initialPageSize: 20,
 * })
 * ```
 */
export function usePaginatedQuery<TData, TError = Error>(
  options: UsePaginatedQueryOptions<TData, TError>
): UsePaginatedQueryResult<TData> {
  const { queryKey, queryFn, initialPage = 1, initialPageSize = 10, ...queryOptions } = options
  const [pagination, setPagination] = useState<PaginationParams>({
    page: initialPage,
    pageSize: initialPageSize,
  })

  const queryClient = useQueryClient()

  const query = useQuery<PaginatedResponse<TData>, TError>({
    ...queryOptions,
    queryKey: [...queryKey, pagination.page, pagination.pageSize],
    queryFn: () => queryFn(pagination),
  })

  const { data: paginatedData = null, isPending, isError, error } = query

  const data = paginatedData?.data ?? []
  const total = paginatedData?.total ?? 0
  const totalPages = paginatedData?.totalPages ?? 0

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((prev) => ({ ...prev, page }))
    }
  }

  const nextPage = () => {
    goToPage(pagination.page + 1)
  }

  const previousPage = () => {
    goToPage(pagination.page - 1)
  }

  const handleSetPageSize = (newPageSize: number) => {
    setPagination({ page: 1, pageSize: newPageSize })
  }

  return {
    data,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    isPending,
    isError,
    error: error || null,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    canNextPage: pagination.page < totalPages,
    canPreviousPage: pagination.page > 1,
  }
}
