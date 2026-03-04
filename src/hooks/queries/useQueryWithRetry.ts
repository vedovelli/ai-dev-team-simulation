import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

export interface RetryConfig<TError = Error> {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  shouldRetry?: (error: TError, failureCount: number) => boolean
}

export interface UseQueryWithRetryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'retry' | 'retryDelay'> {
  retryConfig?: RetryConfig<TError>
}

/**
 * Hook for queries with advanced retry and error recovery strategies.
 * Implements exponential backoff and smart retry logic.
 *
 * Usage:
 * ```tsx
 * const { data, error, isLoading, retry } = useQueryWithRetry({
 *   queryKey: ['data'],
 *   queryFn: fetchData,
 *   retryConfig: {
 *     maxRetries: 3,
 *     initialDelayMs: 1000,
 *   }
 * })
 * ```
 */
export function useQueryWithRetry<TData, TError = Error>(
  options: UseQueryWithRetryOptions<TData, TError>
) {
  const {
    retryConfig = {},
    ...queryOptions
  } = options

  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    shouldRetry: customShouldRetry,
  } = retryConfig

  const [retryCount, setRetryCount] = useState(0)

  const retryDelay = (attemptIndex: number) => {
    const delay = Math.min(
      initialDelayMs * Math.pow(backoffMultiplier, attemptIndex),
      maxDelayMs
    )
    return delay
  }

  const shouldRetry = (failureCount: number, error: TError) => {
    if (failureCount >= maxRetries) return false

    // Use custom retry logic if provided, otherwise use default
    if (customShouldRetry) {
      return customShouldRetry(error, failureCount)
    }

    return isRetriableError(error)
  }

  const manualRetry = useCallback(() => {
    setRetryCount(0)
  }, [])

  const query = useQuery<TData, TError>({
    ...queryOptions,
    retry: (failureCount, error) => shouldRetry(failureCount, error as TError),
    retryDelay: (attemptIndex) => retryDelay(attemptIndex),
  })

  return {
    ...query,
    retryCount,
    manualRetry,
    isRecoverable: retryCount < maxRetries,
  }
}

/**
 * Determines if an error is retriable based on common patterns.
 * Checks for network errors, timeouts, and server errors.
 */
function isRetriableError(error: unknown): boolean {
  // Handle structured error objects (e.g., fetch API errors)
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>

    // Check for HTTP status code property (5xx are retriable)
    if (typeof err.status === 'number' && err.status >= 500) {
      return true
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network-related errors are retriable
    const networkPatterns = ['network', 'timeout', 'econnrefused', 'econnreset', 'econnaborted', 'etimedout']
    if (networkPatterns.some(pattern => message.includes(pattern))) {
      return true
    }
  }

  return false
}
