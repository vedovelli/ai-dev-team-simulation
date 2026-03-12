import { useState } from 'react'
import { useSprints } from '../../hooks/queries/sprints'
import { useRestoreSprint } from '../../hooks/mutations/useRestoreSprint'

interface ArchivedSprintsListProps {
  onRestoreSuccess: () => void
}

export function ArchivedSprintsList({ onRestoreSuccess }: ArchivedSprintsListProps) {
  const [expandedSprintId, setExpandedSprintId] = useState<string | null>(null)
  const { data: response, isLoading } = useSprints(1, 100, 'archived')
  const restoreMutation = useRestoreSprint()

  const archivedSprints = response?.data || []

  const handleRestore = async (sprintId: string) => {
    try {
      await restoreMutation.mutateAsync({
        sprintId,
        restoreStatus: 'completed',
      })
      onRestoreSuccess()
    } catch (error) {
      console.error('Failed to restore sprint:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (archivedSprints.length === 0) {
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="text-gray-900 font-semibold mb-1">No Archived Sprints</h3>
        <p className="text-gray-600 text-sm">
          Completed sprints will appear here once archived.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          Found {archivedSprints.length} archived sprint{archivedSprints.length !== 1 ? 's' : ''}. Click
          to expand details and restore if needed.
        </p>
      </div>

      <div className="space-y-2">
        {archivedSprints.map((sprint) => (
          <div key={sprint.id} className="border rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() =>
                setExpandedSprintId(
                  expandedSprintId === sprint.id ? null : sprint.id
                )
              }
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <div
                  className={`transform transition-transform ${
                    expandedSprintId === sprint.id ? 'rotate-90' : ''
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sprint.completedCount}/{sprint.taskCount} tasks completed •{' '}
                    {sprint.estimatedPoints} points
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                archived
              </span>
            </button>

            {/* Expanded Content */}
            {expandedSprintId === sprint.id && (
              <div className="px-4 py-4 bg-white border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Completion Rate
                    </p>
                    <p className="text-lg font-semibold text-blue-600 mt-1">
                      {sprint.taskCount
                        ? Math.round((sprint.completedCount / sprint.taskCount) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Created
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(sprint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      Start Date
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {sprint.startDate
                        ? new Date(sprint.startDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      End Date
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {sprint.endDate
                        ? new Date(sprint.endDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {sprint.goals && (
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">
                      Goals
                    </p>
                    <p className="text-sm text-gray-700">{sprint.goals}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => handleRestore(sprint.id)}
                    disabled={restoreMutation.isPending}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {restoreMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      'Restore Sprint'
                    )}
                  </button>
                </div>

                {restoreMutation.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      {restoreMutation.error instanceof Error
                        ? restoreMutation.error.message
                        : 'Failed to restore sprint'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
