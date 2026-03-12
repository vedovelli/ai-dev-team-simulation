import { useState } from 'react'
import type { Sprint } from '../../types/sprint'
import { useArchiveSprint } from '../../hooks/mutations/useArchiveSprint'

interface SprintArchivePanelProps {
  sprint: Sprint
  onArchiveSuccess: () => void
  onClose: () => void
}

export function SprintArchivePanel({
  sprint,
  onArchiveSuccess,
  onClose,
}: SprintArchivePanelProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const archiveMutation = useArchiveSprint()

  const completionPercentage = sprint.taskCount
    ? Math.round((sprint.completedCount / sprint.taskCount) * 100)
    : 0

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(sprint.id)
      onArchiveSuccess()
    } catch (error) {
      console.error('Failed to archive sprint:', error)
    }
  }

  if (showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Archive Sprint Confirmation
          </h3>
          <p className="text-sm text-yellow-800">
            You are about to archive this sprint. This action will move it to the archived
            sprints list for historical reference.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Final Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {completionPercentage}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Tasks Completed
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {sprint.completedCount}/{sprint.taskCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Estimated Points
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {sprint.estimatedPoints}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">
                Sprint Duration
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {sprint.startDate && sprint.endDate
                  ? Math.ceil(
                      (new Date(sprint.endDate).getTime() -
                        new Date(sprint.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 'N/A'}{' '}
                days
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={archiveMutation.isPending}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {archiveMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Archiving...
              </>
            ) : (
              'Archive Sprint'
            )}
          </button>
        </div>

        {archiveMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              {archiveMutation.error instanceof Error
                ? archiveMutation.error.message
                : 'Failed to archive sprint'}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Archive This Sprint</h3>
        <p className="text-sm text-blue-800">
          Move this sprint to the archived list to keep your workspace organized. You can
          restore it later if needed.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Sprint Name</span>
          <span className="font-semibold text-gray-900">{sprint.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Current Status</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {sprint.status}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Completed Tasks</span>
          <span className="font-semibold text-gray-900">
            {sprint.completedCount}/{sprint.taskCount}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Completion Rate</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="font-semibold text-gray-900 w-12">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
        >
          Close
        </button>
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={sprint.status !== 'completed'}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            sprint.status !== 'completed'
              ? 'Only completed sprints can be archived'
              : undefined
          }
        >
          Proceed to Archive
        </button>
      </div>

      {sprint.status !== 'completed' && (
        <p className="text-sm text-gray-600">
          Only sprints with a "completed" status can be archived.
        </p>
      )}
    </div>
  )
}
