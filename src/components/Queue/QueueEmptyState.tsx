interface QueueEmptyStateProps {
  filterType: string
}

export function QueueEmptyState({ filterType }: QueueEmptyStateProps) {
  let message = 'No tasks found'

  if (filterType === 'unassigned') {
    message = 'No unassigned tasks'
  } else if (filterType !== 'all') {
    message = `No tasks for this agent`
  }

  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-900 mb-1">{message}</p>
      <p className="text-gray-600">Try adjusting your filter to see more tasks</p>
    </div>
  )
}
