import { QueryClient } from '@tanstack/react-query'

/**
 * Cache invalidation utility for TanStack Query
 * Provides common patterns for invalidating and managing query cache
 */
export class CacheInvalidationManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate a single query by key
   */
  invalidateQuery(queryKey: (string | number | object)[]) {
    return this.queryClient.invalidateQueries({ queryKey })
  }

  /**
   * Invalidate multiple related queries
   */
  invalidateQueries(queryKeys: Array<(string | number | object)[]>) {
    return Promise.all(queryKeys.map((key) => this.invalidateQuery(key)))
  }

  /**
   * Invalidate all queries with a specific prefix
   * Useful for invalidating all user-related queries when user updates
   */
  invalidateQueriesByPrefix(prefix: string) {
    return this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey
        return Array.isArray(queryKey) && queryKey[0] === prefix
      },
    })
  }

  /**
   * Refetch a query immediately
   */
  refetchQuery(queryKey: (string | number | object)[]) {
    return this.queryClient.refetchQueries({ queryKey })
  }

  /**
   * Clear cache for a specific query
   */
  removeQuery(queryKey: (string | number | object)[]) {
    this.queryClient.removeQueries({ queryKey })
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.queryClient.clear()
  }

  /**
   * Set data for a query directly (useful for optimistic updates fallback)
   */
  setQueryData<T>(queryKey: (string | number | object)[], data: T) {
    return this.queryClient.setQueryData(queryKey, data)
  }

  /**
   * Get data for a query
   */
  getQueryData<T>(queryKey: (string | number | object)[]): T | undefined {
    return this.queryClient.getQueryData(queryKey)
  }
}

/**
 * Create cache invalidation manager instance
 */
export function createCacheInvalidationManager(queryClient: QueryClient) {
  return new CacheInvalidationManager(queryClient)
}
