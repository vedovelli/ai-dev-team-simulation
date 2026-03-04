import type { QueryClient } from '@tanstack/react-query'

/**
 * Creates a loader function that pre-fetches data with React Query
 * This ensures data is available before the route component renders
 */
export function createQueryLoader<T>(
  queryClient: QueryClient,
  queryKey: string[],
  queryFn: () => Promise<T>,
  options = {}
) {
  return async () => {
    try {
      // Ensure the query is cached before returning
      await queryClient.ensureQueryData({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
      })
    } catch (error) {
      // If the pre-fetch fails, we'll let the component handle the error
      console.warn('Route loader failed:', error)
      throw error
    }
  }
}

/**
 * Creates a loader function for paginated data
 */
export function createPaginatedLoader<T>(
  queryClient: QueryClient,
  queryKeyFactory: (page: number) => string[],
  queryFn: (page: number) => Promise<T>,
  page = 1,
  options = {}
) {
  return async () => {
    try {
      await queryClient.ensureQueryData({
        queryKey: queryKeyFactory(page),
        queryFn: () => queryFn(page),
        staleTime: 5 * 60 * 1000,
        ...options,
      })
    } catch (error) {
      console.warn('Paginated route loader failed:', error)
      throw error
    }
  }
}

/**
 * Creates a loader function for nested route data
 */
export function createNestedLoader<T>(
  queryClient: QueryClient,
  queryKey: string[],
  queryFn: (params: Record<string, any>) => Promise<T>,
  params: Record<string, any>,
  options = {}
) {
  return async () => {
    try {
      await queryClient.ensureQueryData({
        queryKey,
        queryFn: () => queryFn(params),
        staleTime: 5 * 60 * 1000,
        ...options,
      })
    } catch (error) {
      console.warn('Nested route loader failed:', error)
      throw error
    }
  }
}

/**
 * Invalidates related queries when data changes
 */
export function invalidateRelatedQueries(
  queryClient: QueryClient,
  invalidationKeys: string[][]
) {
  invalidationKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key })
  })
}
