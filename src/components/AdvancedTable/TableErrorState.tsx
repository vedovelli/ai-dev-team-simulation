interface TableErrorStateProps {
  message?: string
  error?: Error
  onRetry?: () => void
  icon?: React.ReactNode
}

export function TableErrorState({
  message = 'Failed to load data',
  error,
  onRetry,
  icon = '❌',
}: TableErrorStateProps) {
  return (
    <div
      className="rounded-lg border-2 border-red-200 bg-red-50 p-8"
      role="alert"
      aria-label="Error loading table"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 text-4xl">{icon}</div>
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
        <p className="text-red-600 mb-4">{message}</p>

        {error && (
          <details className="max-w-md mb-4">
            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700 font-medium">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-white border border-red-200 rounded text-xs text-red-700 overflow-auto max-h-40">
              {error.message}
            </pre>
          </details>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
