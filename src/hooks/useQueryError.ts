import { useCallback, useContext, useRef, useState, useReducer } from 'react'
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
 * Error state for tracking
 */
interface ErrorState {
  error: Error | null
  retryCount: number
  timestamp: number
}

/**
 * Actions for error state reducer
 */
type ErrorAction =
  | { type: 'SET_ERROR'; payload: { error: Error; timestamp: number } }
  | { type: 'UPDATE_RETRY_COUNT'; payload: { error: Error; retryCount: number; timestamp: number } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_RETRY_COUNT' }

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

  // Reducer to manage error state and avoid circular dependencies
  const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
    switch (action.type) {
      case 'SET_ERROR':
        return { error: action.payload.error, retryCount: 0, timestamp: action.payload.timestamp }
      case 'UPDATE_RETRY_COUNT':
        return { error: action.payload.error, retryCount: action.payload.retryCount, timestamp: action.payload.timestamp }
      case 'RESET_RETRY_COUNT':
        return { error: state.error, retryCount: 0, timestamp: state.timestamp }
      case 'CLEAR_ERROR':
        return { error: null, retryCount: 0, timestamp: 0 }
      default:
        return state
    }
  }

  const [errorState, dispatchError] = useReducer(errorReducer, {
    error: null,
    retryCount: 0,
    timestamp: 0,
  })

  const [isRetrying, setIsRetrying] = useState(false)

  // Store retry function to allow manual retries
  const retryFnRef = useRef<(() => Promise<void>) | null>(null)
  const retryCountRef = useRef<number>(0)

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
   * Note: This is a recursive function reference to avoid circular dependencies
   */
  const handleRetryRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const performRetry = useCallback(async () => {
    if (!retryFnRef.current) {
      return
    }

    const nextRetryCount = retryCountRef.current + 1
    if (nextRetryCount > maxRetries) {
      return
    }

    setIsRetrying(true)

    // Notify provider if available
    if (errorContext) {
      errorContext.registerError({
        error: errorState.error,
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
      dispatchError({ type: 'CLEAR_ERROR' })
      retryCountRef.current = 0

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

      retryCountRef.current = nextRetryCount
      dispatchError({
        type: 'UPDATE_RETRY_COUNT',
        payload: { error: err, retryCount: nextRetryCount, timestamp: Date.now() },
      })

      // If we've exhausted retries, show final error
      if (nextRetryCount >= maxRetries) {
        if (showNotification) {
          toast.error(
            errorMessage || `Operation failed after ${maxRetries} retry attempts`,
            {
              action: {
                label: 'Retry',
                onClick: () => handleRetryRef.current(),
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
    maxRetries,
    showNotification,
    showRetryNotification,
    getBackoffDelay,
    toast,
    errorContext,
    context,
    errorMessage,
  ])

  // Store performRetry reference for recursion
  handleRetryRef.current = performRetry

  /**
   * Main error handler - no longer depends on errorMetadata to avoid circular deps
   */
  const handleError = useCallback(
    async (error: Error | null, retryFn?: () => Promise<void>) => {
      if (!error) {
        dispatchError({ type: 'CLEAR_ERROR' })
        retryFnRef.current = null
        return
      }

      // Store retry function for later use
      if (retryFn) {
        retryFnRef.current = retryFn
      }

      // Update error state and reset retry count
      retryCountRef.current = 0
      dispatchError({ type: 'SET_ERROR', payload: { error, timestamp: Date.now() } })

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
        const canRetry = retryFn !== undefined

        toast.error(errorMessage || error.message, {
          action: canRetry
            ? {
                label: 'Retry',
                onClick: () => handleRetryRef.current(),
              }
            : undefined,
        })
      }

      // Auto-retry if retry function is provided
      if (retryFn) {
        // Use setTimeout to allow state to settle before retrying
        await new Promise((resolve) => setTimeout(resolve, 0))
        await handleRetryRef.current()
      }
    },
    [maxRetries, showNotification, toast, errorContext, context, errorMessage]
  )

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    dispatchError({ type: 'CLEAR_ERROR' })
    retryCountRef.current = 0
    retryFnRef.current = null

    if (errorContext) {
      errorContext.clearError()
    }
  }, [errorContext])

  /**
   * Public retry method
   */
  const retry = useCallback(() => {
    handleRetryRef.current()
  }, [])

  return {
    error: errorState.error,
    isRetrying,
    retry,
    handleError,
    clearError,
  }
}
