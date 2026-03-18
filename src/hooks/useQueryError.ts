import { useCallback, useContext, useRef, useState } from 'react'
import { useToast } from './useToast'
import { ErrorContext } from '../context/ErrorProvider'

/**
 * Configuration for useQueryError hook
 */
export interface UseQueryErrorOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Custom error message for display (overrides default) */
  errorMessage?: string
  /** Whether to show toast notification on error (default: true) */
  showNotification?: boolean
  /** Whether to show toast on retry attempts (default: true) */
  showRetryNotification?: boolean
  /** Context identifier for tracking errors (e.g., 'notifications', 'taskAssignment') */
  context?: string
}

/**
 * Error metadata for tracking
 */
interface ErrorMetadata {
  error: Error | null
  retryCount: number
  timestamp: number
}

/**
 * Return type for useQueryError hook
 */
export interface UseQueryErrorReturn {
  /** Current error, if any */
  error: Error | null
  /** Whether currently retrying */
  isRetrying: boolean
  /** Manually trigger a retry */
  retry: () => void
  /** Handle an error and show notifications */
  handleError: (error: Error | null, retryFn?: () => Promise<void>) => Promise<void>
  /** Clear current error */
  clearError: () => void
}

/**
 * Hook for centralized query error handling with auto-retry and toast notifications
 *
 * Features:
 * - Exponential backoff retry (1s/2s/4s delays)
 * - Toast notifications on error and retry
 * - Integrates with ErrorProvider context if available
 * - Unit-testable without provider
 *
 * @example
 * ```tsx
 * const { error, isRetrying, retry, handleError } = useQueryError({
 *   context: 'notifications',
 *   errorMessage: 'Failed to load notifications',
 * })
 *
 * // Use with query error
 * if (query.isError) {
 *   handleError(query.error)
 * }
 *
 * // Or with manual error handling
 * try {
 *   await fetchData()
 * } catch (error) {
 *   await handleError(error as Error, () => fetchData())
 * }
 * ```
 */
export function useQueryError(options: UseQueryErrorOptions = {}): UseQueryErrorReturn {
  const {
    maxRetries = 3,
    errorMessage,
    showNotification = true,
    showRetryNotification = true,
    context,
  } = options

  const [errorMetadata, setErrorMetadata] = useState<ErrorMetadata>({
    error: null,
    retryCount: 0,
    timestamp: 0,
  })

  const [isRetrying, setIsRetrying] = useState(false)

  // Store retry function to allow manual retries
  const retryFnRef = useRef<(() => Promise<void>) | null>(null)

  const toast = useToast()
  const errorContext = useContext(ErrorContext)

  /**
   * Calculate exponential backoff delay (1s, 2s, 4s)
   */
  const getBackoffDelay = useCallback((attemptIndex: number): number => {
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000)
  }, [])

  /**
   * Handle retry logic with exponential backoff
   */
  const handleRetry = useCallback(async () => {
    if (!retryFnRef.current) {
      return
    }

    const nextRetryCount = errorMetadata.retryCount + 1
    if (nextRetryCount > maxRetries) {
      return
    }

    setIsRetrying(true)

    // Notify provider if available
    if (errorContext) {
      errorContext.registerError({
        error: errorMetadata.error,
        context,
        timestamp: Date.now(),
        isRetrying: true,
      })
    }

    // Show retry notification if enabled
    if (showRetryNotification) {
      toast.info(`Retrying... (Attempt ${nextRetryCount}/${maxRetries})`)
    }

    // Calculate backoff delay
    const delay = getBackoffDelay(nextRetryCount - 1)

    try {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Execute retry function
      await retryFnRef.current()

      // Success - clear error
      setErrorMetadata({
        error: null,
        retryCount: 0,
        timestamp: 0,
      })

      // Notify context of successful retry
      if (errorContext) {
        errorContext.clearError()
      }

      if (showNotification) {
        toast.success('Recovered successfully!')
      }
    } catch (error) {
      // Update error and retry count
      const err = error instanceof Error ? error : new Error(String(error))

      setErrorMetadata((prev) => ({
        error: err,
        retryCount: nextRetryCount,
        timestamp: Date.now(),
      }))

      // If we've exhausted retries, show final error
      if (nextRetryCount >= maxRetries) {
        if (showNotification) {
          toast.error(
            errorMessage || `Operation failed after ${maxRetries} retry attempts`,
            {
              action: {
                label: 'Retry',
                onClick: () => handleRetry(),
              },
            }
          )
        }

        // Notify context of final failure
        if (errorContext) {
          errorContext.registerError({
            error: err,
            context,
            timestamp: Date.now(),
            isRetrying: false,
            retriesExhausted: true,
          })
        }
      }
    } finally {
      setIsRetrying(false)
    }
  }, [
    errorMetadata.error,
    errorMetadata.retryCount,
    maxRetries,
    showNotification,
    showRetryNotification,
    getBackoffDelay,
    toast,
    errorContext,
    context,
    errorMessage,
  ])

  /**
   * Main error handler
   */
  const handleError = useCallback(
    async (error: Error | null, retryFn?: () => Promise<void>) => {
      if (!error) {
        clearError()
        return
      }

      // Store retry function for later use
      if (retryFn) {
        retryFnRef.current = retryFn
      }

      // Update error state
      setErrorMetadata({
        error,
        retryCount: 0,
        timestamp: Date.now(),
      })

      // Notify context
      if (errorContext) {
        errorContext.registerError({
          error,
          context,
          timestamp: Date.now(),
          isRetrying: false,
        })
      }

      // Show initial error notification
      if (showNotification) {
        const canRetry = retryFn !== undefined && errorMetadata.retryCount < maxRetries

        toast.error(errorMessage || error.message, {
          action: canRetry
            ? {
                label: 'Retry',
                onClick: () => handleRetry(),
              }
            : undefined,
        })
      }

      // Auto-retry if retry function is provided
      if (retryFn) {
        // Use setImmediate to allow state to settle before retrying
        await new Promise((resolve) => setTimeout(resolve, 0))
        await handleRetry()
      }
    },
    [
      errorMetadata.retryCount,
      maxRetries,
      showNotification,
      handleRetry,
      toast,
      errorContext,
      context,
      errorMessage,
    ]
  )

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setErrorMetadata({
      error: null,
      retryCount: 0,
      timestamp: 0,
    })

    retryFnRef.current = null

    if (errorContext) {
      errorContext.clearError()
    }
  }, [errorContext])

  /**
   * Public retry method
   */
  const retry = useCallback(() => {
    handleRetry()
  }, [handleRetry])

  return {
    error: errorMetadata.error,
    isRetrying,
    retry,
    handleError,
    clearError,
  }
}

export type UseQueryErrorReturn_Type = ReturnType<typeof useQueryError>
