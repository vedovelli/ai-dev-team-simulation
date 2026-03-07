/**
 * Advanced Query Hook with Proper Typing
 *
 * This hook demonstrates best practices for TanStack Query usage:
 * - Full TypeScript support with generics
 * - Consistent error handling
 * - Query key factory integration
 * - Optimized caching strategy
 * - Integrated retry metrics collection
 *
 * @example
 * const { data, isLoading, error } = useAdvancedQuery({
 *   queryKey: queryKeys.tasks.list(),
 *   queryFn: fetchTasks,
 * })
 */

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryKey,
} from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useRetryMetrics } from './useRetryMetrics'

interface AdvancedQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  enableMetrics?: boolean
}

interface AdvancedQueryResult<TData, TError = Error>
  extends UseQueryResult<TData, TError> {
  isIdle: boolean
}

/**
 * Advanced query hook with enhanced error handling and callbacks
 * Includes integrated metrics collection for retry monitoring
 *
 * @param options - Query options with queryKey and queryFn
 * @returns Query result with loading, error, and data states
 */
export function useAdvancedQuery<TData, TError = Error>(
  options: AdvancedQueryOptions<TData, TError>,
): AdvancedQueryResult<TData, TError> {
  const { onSuccess, onError, enableMetrics = true, ...queryOptions } = options
  const metrics = useRetryMetrics()
  const startTimeRef = useRef<number>(0)
  const attemptsRef = useRef<number>(0)
  const queryKeyString = JSON.stringify(options.queryKey)

  const result = useQuery<TData, TError>({
    ...queryOptions,
    queryKey: options.queryKey,
    queryFn: async () => {
      if (enableMetrics) {
        startTimeRef.current = performance.now()
        attemptsRef.current += 1
        metrics.recordAttempt(queryKeyString)
      }
      return options.queryFn()
    },
  })

  // Track metrics on success
  useEffect(() => {
    if (result.isSuccess && enableMetrics && startTimeRef.current > 0) {
      const duration = performance.now() - startTimeRef.current
      metrics.recordSuccess(queryKeyString, Math.round(duration), attemptsRef.current)
      attemptsRef.current = 0
    }
  }, [result.isSuccess, enableMetrics, queryKeyString, metrics])

  // Track metrics on failure
  useEffect(() => {
    if (result.isError && enableMetrics && startTimeRef.current > 0) {
      const duration = performance.now() - startTimeRef.current
      const errorMessage = result.error instanceof Error ? result.error.message : String(result.error)
      metrics.recordFailure(queryKeyString, Math.round(duration), attemptsRef.current, errorMessage)
      attemptsRef.current = 0
    }
  }, [result.isError, enableMetrics, queryKeyString, result.error, metrics])

  // Call success callback when data is available
  if (result.isSuccess && onSuccess) {
    onSuccess(result.data)
  }

  // Call error callback when error occurs
  if (result.isError && onError) {
    onError(result.error)
  }

  return {
    ...result,
    isIdle: result.status === 'pending' && !result.isFetching,
  } as AdvancedQueryResult<TData, TError>
}

/**
 * Specialized hook for fetching a list of items with pagination/filtering support
 *
 * @example
 * const { data: tasks, isLoading } = useListQuery({
 *   queryKey: queryKeys.tasks.list({ status: 'in-progress' }),
 *   queryFn: () => fetchTasks({ status: 'in-progress' }),
 * })
 */
export function useListQuery<TItem, TError = Error>(
  options: AdvancedQueryOptions<TItem[], TError>,
): AdvancedQueryResult<TItem[], TError> {
  return useAdvancedQuery(options)
}

/**
 * Specialized hook for fetching a single item by ID
 *
 * @example
 * const { data: task } = useDetailQuery({
 *   queryKey: queryKeys.tasks.detail('task-123'),
 *   queryFn: () => fetchTask('task-123'),
 *   enabled: !!taskId, // Conditional query
 * })
 */
export function useDetailQuery<TItem, TError = Error>(
  options: AdvancedQueryOptions<TItem, TError>,
): AdvancedQueryResult<TItem, TError> {
  return useAdvancedQuery(options)
}
