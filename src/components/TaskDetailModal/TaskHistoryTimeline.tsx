import { useQuery } from '@tanstack/react-query'
import type { TaskHistoryEntry } from '../../types/task'

interface TaskHistoryTimelineProps {
  taskId: string
}

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return date.toLocaleDateString()
}

const formatFieldName = (field: string): string => {
  const map: Record<string, string> = {
    title: 'Title',
    priority: 'Priority',
    status: 'Status',
    assignee: 'Assignee',
    deadline: 'Deadline',
    estimatedHours: 'Estimated Hours',
  }
  return map[field] || field
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export function TaskHistoryTimeline({ taskId }: TaskHistoryTimelineProps) {
  const { data: history, isLoading, error } = useQuery<TaskHistoryEntry[]>({
    queryKey: ['tasks', taskId, 'history'],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/history`)
      if (!response.ok) throw new Error('Failed to fetch task history')
      return response.json()
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Failed to load task history</p>
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">No changes yet</p>
      </div>
    )
  }

  // Sort by newest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-4">
      {sortedHistory.map((entry, index) => (
        <div key={entry.id} className="relative">
          {/* Timeline line */}
          {index !== sortedHistory.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
          )}

          {/* Entry */}
          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className="flex flex-col items-center pt-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-200" />
            </div>

            {/* Content */}
            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {entry.actor} changed {formatFieldName(entry.field)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{getRelativeTime(entry.createdAt)}</p>
                </div>
              </div>

              <div className="mt-2 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">From:</span>
                  <code className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                    {formatValue(entry.previousValue)}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">To:</span>
                  <code className="px-2 py-1 bg-green-100 rounded text-xs text-green-700">
                    {formatValue(entry.newValue)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
