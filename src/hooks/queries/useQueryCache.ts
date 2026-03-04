import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useCallback } from 'react'

export interface InvalidationStrategy {
  exact?: boolean
  stale?: boolean
}

/**
 * Hook for managing query cache invalidation strategies.
 * Provides methods for invalidating queries with different strategies.
 *
 * Usage:
 * ```tsx
 * const { invalidateQueries, invalidateExact, invalidateAndRefetch } = useQueryCache()
 *
 * // Invalidate all queries matching a key prefix
 * invalidateQueries(['users'])
 *
 * // Invalidate exact query match
 * invalidateExact(['users', 1])
 *
 * // Invalidate and immediately refetch
 * invalidateAndRefetch(['posts'])
 * ```
 */
export function useQueryCache() {
  const queryClient = useQueryClient()

  const invalidateQueries = useCallback(
    (queryKey: QueryKey, options?: InvalidationStrategy) => {
      return queryClient.invalidateQueries({
        queryKey,
        exact: options?.exact ?? false,
        stale: options?.stale,
      })
    },
    [queryClient]
  )

  const invalidateExact = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.invalidateQueries({
        queryKey,
        exact: true,
      })
    },
    [queryClient]
  )

  const invalidateAndRefetch = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.invalidateQueries({
        queryKey,
        exact: false,
        refetchType: 'active',
      })
    },
    [queryClient]
  )

  const removeQueries = useCallback(
    (queryKey: QueryKey) => {
      return queryClient.removeQueries({
        queryKey,
      })
    },
    [queryClient]
  )

  const prefetchQuery = useCallback(
    (queryKey: QueryKey, queryFn: () => Promise<unknown>) => {
      return queryClient.prefetchQuery({
        queryKey,
        queryFn,
      })
    },
    [queryClient]
  )

  const setQueryData = useCallback(
    <T,>(queryKey: QueryKey, data: T) => {
      return queryClient.setQueryData(queryKey, data)
    },
    [queryClient]
  )

  return {
    invalidateQueries,
    invalidateExact,
    invalidateAndRefetch,
    removeQueries,
    prefetchQuery,
    setQueryData,
    queryClient,
  }
}
