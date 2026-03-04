/**
 * Error Boundary Component
 *
 * Catches runtime errors and displays user-friendly error messages.
 * Useful for handling unexpected errors during data fetching.
 */

import React, { type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo)
  }

  retry = () => {
    this.setState({ error: null, hasError: false })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry)
      }

      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold text-lg mb-2">Something went wrong</h2>
          <p className="mb-4 text-sm">{this.state.error.message}</p>
          <button
            onClick={this.retry}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Query Error Boundary
 *
 * Specialized error boundary for handling query errors.
 * Shows loading state, error state, and allows retry.
 */
interface QueryErrorBoundaryProps {
  children: ReactNode
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function QueryErrorBoundary({
  children,
  isLoading,
  error,
  onRetry,
}: QueryErrorBoundaryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
        <h3 className="font-bold mb-2">Failed to load data</h3>
        <p className="text-sm mb-4">{error.message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Mutation Error Display
 *
 * Non-dismissable error display for mutations.
 * Useful for form submissions or other mutations.
 */
interface MutationErrorProps {
  error?: Error | null
  onDismiss?: () => void
}

export function MutationError({ error, onDismiss }: MutationErrorProps) {
  if (!error) return null

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold mb-1">Error</h4>
          <p className="text-sm">{error.message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Loading Spinner Component
 *
 * Reusable loading indicator.
 */
interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-b-1',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-12 w-12 border-b-4',
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <div
        className={`inline-block animate-spin rounded-full border-blue-500 ${sizeClasses[size]}`}
      ></div>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

/**
 * Empty State Component
 *
 * Display when no data is available.
 */
interface EmptyStateProps {
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      {message && <p className="text-gray-600 mb-4">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
