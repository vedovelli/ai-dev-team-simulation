import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

export interface RetryConfig {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

export interface UseQueryWithRetryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'retry' | 'retryDelay'> {
  retryConfig?: RetryConfig
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

    // Check if error is retriable (network errors, 5xx status codes, etc.)
    const isRetriable = isRetriableError(error)
    return isRetriable
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
 */
function isRetriableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors are retriable
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset')
    ) {
      return true
    }

    // Check for HTTP status codes in error message
    if (message.includes('5')) {
      return true
    }
  }

  return false
}
