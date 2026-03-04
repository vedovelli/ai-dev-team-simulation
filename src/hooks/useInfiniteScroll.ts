import { useInfiniteQuery, type UseInfiniteQueryOptions } from '@tanstack/react-query'
import type { ReactNode } from 'react'

export interface PaginatedCursorResponse<T> {
  data: T[]
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string | null
    startCursor?: string | null
  }
}

export interface UseInfiniteScrollOptions<TData, TError = Error>
  extends Omit<
    UseInfiniteQueryOptions<PaginatedCursorResponse<TData>, TError, PaginatedCursorResponse<TData>, PaginatedCursorResponse<TData>, (string | number)[], string | null>,
    'queryKey' | 'queryFn' | 'initialPageParam'
  > {
  queryKey: (string | number)[]
  queryFn: (cursor: string | null) => Promise<PaginatedCursorResponse<TData>>
  pageSize?: number
}

export interface UseInfiniteScrollResult<TData> {
  data: TData[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isPending: boolean
  isError: boolean
  error: Error | null
  fetchNextPage: () => Promise<unknown>
  refetch: () => Promise<unknown>
  isRefetching: boolean
}

/**
 * Hook for handling infinite scroll pagination with cursor-based pagination.
 * Useful for feed-like interfaces and performance optimization.
 *
 * Usage:
 * ```tsx
 * const {
 *   data,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   fetchNextPage,
 * } = useInfiniteScroll({
 *   queryKey: ['items'],
 *   queryFn: (cursor) => fetchItems(cursor),
 *   pageSize: 20,
 * })
 * ```
 */
export function useInfiniteScroll<TData, TError = Error>(
  options: UseInfiniteScrollOptions<TData, TError>,
): UseInfiniteScrollResult<TData> {
  const { queryKey, queryFn, pageSize = 20, ...queryOptions } = options

  const query = useInfiniteQuery<
    PaginatedCursorResponse<TData>,
    TError,
    PaginatedCursorResponse<TData>,
    (string | number)[],
    string | null
  >({
    ...queryOptions,
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor ?? null : undefined
    },
  })

  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage, isRefetching, refetch } = query

  const allData = data?.pages.flatMap((page) => page.data) ?? []

  return {
    data: allData,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isPending,
    isError,
    error: error || null,
    fetchNextPage,
    refetch,
    isRefetching,
  }
}
