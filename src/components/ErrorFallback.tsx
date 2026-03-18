/**
 * ErrorFallback Component
 *
 * Displays error state with actions: retry, reload, or go back.
 * Integrates with useQueryError hook for retry logic and toast notifications.
 */

import { useCallback } from 'react'
import { useToast } from '../hooks/useToast'

interface ErrorFallbackProps {
  /** The error object */
  error: Error | null
  /** Whether currently retrying */
  isRetrying?: boolean
  /** Callback to retry the operation */
  onRetry: () => void
  /** Custom error title */
  title?: string
  /** Custom error message */
  message?: string
  /** Show error details toggle */
  showDetails?: boolean
}

/**
 * ErrorFallback Component
 *
 * Displays error with retry/reload/go-back actions and accessible markup
 *
 * @example
 * ```tsx
 * const { error, isRetrying, retry } = useQueryError()
 *
 * if (error) {
 *   return (
 *     <ErrorFallback
 *       error={error}
 *       isRetrying={isRetrying}
 *       onRetry={retry}
 *       title="Failed to load notifications"
 *     />
 *   )
 * }
 * ```
 */
export function ErrorFallback({
  error,
  isRetrying = false,
  onRetry,
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading data. Please try again.',
  showDetails = true,
}: ErrorFallbackProps) {
  const toast = useToast()

  const handleRetry = useCallback(() => {
    toast.info('Attempting to reload data...')
    onRetry()
  }, [onRetry, toast])

  const handleReload = useCallback(() => {
    toast.info('Reloading page...')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }, [toast])

  const handleGoBack = useCallback(() => {
    window.history.back()
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="mb-4 text-5xl">❌</div>

      {/* Error Title */}
      <h2 className="text-xl font-bold text-slate-100 mb-2">{title}</h2>

      {/* Error Message */}
      <p className="text-slate-400 text-center mb-6 max-w-md">{message}</p>

      {/* Error Details (collapsible) */}
      {error && showDetails && (
        <details className="max-w-md mb-6 w-full">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400 mb-2">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-red-400 overflow-auto max-h-32 border border-slate-700">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-300 transition-colors"
          aria-label={isRetrying ? 'Retrying operation' : 'Retry operation'}
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>

        {/* Reload Button */}
        <button
          onClick={handleReload}
          className="rounded-lg bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600 transition-colors"
          aria-label="Reload page"
        >
          Reload Page
        </button>

        {/* Go Back Button */}
        <button
          onClick={handleGoBack}
          className="rounded-lg bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600 transition-colors"
          aria-label="Go back to previous page"
        >
          Go Back
        </button>
      </div>

      {/* Additional help text for screen readers */}
      <div className="sr-only" role="status">
        Error occurred. Use the buttons above to retry, reload the page, or go back.
      </div>
    </div>
  )
}
