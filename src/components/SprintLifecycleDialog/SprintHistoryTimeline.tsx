import { useSprintHistory } from '../../hooks/queries/sprints'

interface SprintHistoryTimelineProps {
  sprintId: string
}

const eventIcons: Record<string, string> = {
  created: '📋',
  started: '▶️',
  completed: '✅',
  archived: '📦',
  restored: '↩️',
}

const eventColors: Record<string, string> = {
  created: 'bg-blue-100 text-blue-800 border-blue-300',
  started: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-purple-100 text-purple-800 border-purple-300',
  archived: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  restored: 'bg-cyan-100 text-cyan-800 border-cyan-300',
}

export function SprintHistoryTimeline({ sprintId }: SprintHistoryTimelineProps) {
  const { data: history, isLoading } = useSprintHistory(sprintId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-gray-900 font-semibold mb-1">No History</h3>
        <p className="text-gray-600 text-sm">
          Sprint history events will appear here.
        </p>
      </div>
    )
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          Chronological view of sprint state changes
        </p>
      </div>

      <div className="relative space-y-6">
        {sortedHistory.map((event, index) => (
          <div key={event.id} className="relative pl-8">
            {/* Timeline line */}
            {index !== sortedHistory.length - 1 && (
              <div className="absolute left-2 top-10 w-0.5 h-12 bg-gray-200" />
            )}

            {/* Timeline dot */}
            <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-blue-600 rounded-full" />

            {/* Event card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{eventIcons[event.eventType]}</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${eventColors[event.eventType]}`}>
                      {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    {event.description}
                  </p>

                  {event.previousStatus && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-semibold">Before:</span> {event.previousStatus} →{' '}
                      <span className="font-semibold">After:</span> {event.newStatus}
                    </p>
                  )}
                </div>

                <div className="text-right ml-4">
                  <p className="text-xs text-gray-600 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
