interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'An error occurred while loading tasks',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <p className="mb-4 text-gray-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
