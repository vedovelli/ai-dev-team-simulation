import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { ExtendedQueryOptions, QueryRetryConfig } from '@/types/query'

/**
 * Base query hook with standardized error handling and retry logic.
 *
 * Features:
 * - Exponential backoff retry strategy
 * - Smart error detection (network, timeouts, server errors)
 * - Manual retry capability
 * - Recovery status tracking
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, retry } = useBaseQuery({
 *   queryKey: ['users', userId],
 *   queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
 *   retryConfig: {
 *     maxRetries: 3,
 *     initialDelayMs: 1000,
 *   }
 * })
 * ```
 */
export function useBaseQuery<TData = unknown, TError = Error>(
  options: ExtendedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> & {
  retryCount: number
  manualRetry: () => void
  isRecoverable: boolean
} {
  const { retryConfig = {}, ...queryOptions } = options

  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    shouldRetry: customShouldRetry,
  } = retryConfig

  const calculateRetryDelay = (attemptIndex: number): number => {
    const delay = Math.min(
      initialDelayMs * Math.pow(backoffMultiplier, attemptIndex),
      maxDelayMs
    )
    return delay
  }

  const isNetworkError = (error: unknown): boolean => {
    // Check for known network error codes (Node.js/browser)
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>
      const code = err.code as string | undefined

      // Network-specific error codes
      if (code && ['ECONNREFUSED', 'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH'].includes(code)) {
        return true
      }
    }

    // Check for timeout errors specifically
    if (error instanceof Error) {
      const name = error.name
      return name === 'TimeoutError' || name === 'AbortError'
    }

    return false
  }

  const isRetriableError = (error: unknown): boolean => {
    // Handle structured error objects with status codes
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>

      // HTTP 5xx errors are retriable
      if (typeof err.status === 'number' && err.status >= 500) {
        return true
      }
    }

    // Check for network errors
    if (isNetworkError(error)) {
      return true
    }

    return false
  }

  const determineShouldRetry = (failureCount: number, error: TError): boolean => {
    if (failureCount >= maxRetries) return false

    // Use custom retry logic if provided
    if (customShouldRetry) {
      return customShouldRetry(error, failureCount)
    }

    // Default to retriable error detection
    return isRetriableError(error)
  }

  const manualRetry = useCallback(() => {
    query.refetch()
  }, [query])

  const query = useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error) =>
      determineShouldRetry(failureCount, error as TError),
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
  })

  // isRecoverable checks if we can retry again (failureCount is less than maxRetries)
  const isRecoverable = query.failureCount < maxRetries && query.isError

  return {
    ...query,
    retryCount: query.failureCount,
    manualRetry,
    isRecoverable,
  }
}
