interface TableEmptyStateProps {
  message?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export function TableEmptyState({
  message = 'No data available',
  icon = '📭',
  actionLabel,
  onAction,
}: TableEmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50 p-12"
      role="region"
      aria-label="Empty state"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 text-4xl">{icon}</div>
        <p className="text-slate-600 text-base mb-4">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
