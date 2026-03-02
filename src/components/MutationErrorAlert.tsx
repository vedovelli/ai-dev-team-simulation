import { ReactNode } from 'react'

export interface MutationErrorAlertProps {
  error: Error | null
  isLoading?: boolean
  canRetry?: boolean
  onRetry?: () => void
  children?: ReactNode
}

export function MutationErrorAlert({
  error,
  isLoading = false,
  canRetry = false,
  onRetry,
  children,
}: MutationErrorAlertProps) {
  if (!error) {
    return children || null
  }

  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">Error</h3>
          <p className="text-red-700 text-sm">{error.message}</p>
        </div>
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className="ml-2 px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  )
}
