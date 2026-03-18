import { createContext, useCallback, useContext, useState, ReactNode, useMemo } from 'react'

/**
 * Error registration payload
 */
export interface RegisteredError {
  /** The error object */
  error: Error | null
  /** Context identifier (e.g., 'notifications', 'taskAssignment') */
  context?: string
  /** Timestamp of the error */
  timestamp: number
  /** Whether currently retrying */
  isRetrying?: boolean
  /** Whether retries have been exhausted */
  retriesExhausted?: boolean
}

/**
 * Error context API
 */
export interface ErrorContextType {
  /** Register a new error in the error registry */
  registerError: (error: RegisteredError) => void
  /** Clear all errors */
  clearError: () => void
  /** Get errors by context */
  getErrorsByContext: (context?: string) => RegisteredError[]
  /** Get all errors */
  getAllErrors: () => RegisteredError[]
}

/**
 * Create the error context
 */
export const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

/**
 * Props for ErrorProvider
 */
export interface ErrorProviderProps {
  children: ReactNode
  /** Maximum errors to keep in registry (default: 50) */
  maxErrors?: number
}

/**
 * ErrorProvider Context Component
 *
 * Centralizes error tracking and notification dispatch for all queries and mutations.
 *
 * Features:
 * - Error registry with context-based organization
 * - Automatic error tracking from useQueryError hooks
 * - Integration with toast notifications
 * - Support for error recovery workflows
 *
 * @example
 * ```tsx
 * <ErrorProvider>
 *   <App />
 * </ErrorProvider>
 * ```
 */
export function ErrorProvider({ children, maxErrors = 50 }: ErrorProviderProps) {
  const [errors, setErrors] = useState<RegisteredError[]>([])

  /**
   * Register a new error
   */
  const registerError = useCallback((error: RegisteredError) => {
    setErrors((prevErrors) => {
      // Add new error
      const updated = [...prevErrors, error]

      // Keep only the most recent errors (FIFO)
      if (updated.length > maxErrors) {
        return updated.slice(updated.length - maxErrors)
      }

      return updated
    })
  }, [maxErrors])

  /**
   * Clear all errors
   */
  const clearError = useCallback(() => {
    setErrors([])
  }, [])

  /**
   * Get errors by context
   */
  const getErrorsByContext = useCallback(
    (context?: string) => {
      if (!context) {
        return errors
      }

      return errors.filter((e) => e.context === context)
    },
    [errors]
  )

  /**
   * Get all errors
   */
  const getAllErrors = useCallback(() => errors, [errors])

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const value = useMemo<ErrorContextType>(
    () => ({
      registerError,
      clearError,
      getErrorsByContext,
      getAllErrors,
    }),
    [registerError, clearError, getErrorsByContext, getAllErrors]
  )

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

/**
 * Hook to access ErrorContext
 *
 * Must be used within ErrorProvider
 *
 * @example
 * ```tsx
 * const errorContext = useErrorContext()
 * const contextErrors = errorContext.getErrorsByContext('notifications')
 * ```
 */
export function useErrorContext() {
  const context = useContext(ErrorContext)

  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider')
  }

  return context
}

export type ErrorProviderType = typeof ErrorProvider
export type ErrorContextAPI = ErrorContextType
