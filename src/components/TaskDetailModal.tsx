import { useState } from 'react'
import type { Task } from '../types/task'
import { validateDependencies } from '../utils/dependencyValidation'

interface TaskDetailModalProps {
  task: Task
  allTasks: Task[]
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTask: Task) => void
  isLoading?: boolean
}

export function TaskDetailModal({
  task,
  allTasks,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: TaskDetailModalProps) {
  const [dependenciesInput, setDependenciesInput] = useState<string>(
    task.dependsOn?.join(', ') || ''
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = () => {
    setValidationError(null)

    // Parse the comma-separated dependencies
    const dependencyIds = dependenciesInput
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    // Skip validation if no dependencies
    if (dependencyIds.length === 0) {
      onSave({
        ...task,
        dependsOn: [],
        updatedAt: new Date().toISOString(),
      })
      return
    }

    // Validate dependencies
    const error = validateDependencies(task.id, dependencyIds, allTasks)
    if (error) {
      setValidationError(error.message)
      return
    }

    onSave({
      ...task,
      dependsOn: dependencyIds,
      updatedAt: new Date().toISOString(),
    })
  }

  const handleClose = () => {
    setValidationError(null)
    setDependenciesInput(task.dependsOn?.join(', ') || '')
    onClose()
  }

  // Get dependency task titles for display
  const getDependencyDetails = () => {
    if (!task.dependsOn || task.dependsOn.length === 0) {
      return null
    }

    return task.dependsOn.map((depId) => {
      const depTask = allTasks.find((t) => t.id === depId)
      return depTask
        ? `${depTask.id}: ${depTask.title}`
        : `${depId} (not found)`
    })
  }

  const dependencyDetails = getDependencyDetails()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Task Info */}
          <div>
            <p className="text-sm font-medium text-gray-700">ID</p>
            <p className="text-sm text-gray-600">{task.id}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Title</p>
            <p className="text-sm text-gray-600">{task.title}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Status</p>
            <p className="text-sm text-gray-600 capitalize">{task.status}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Assignee</p>
            <p className="text-sm text-gray-600">{task.assignee}</p>
          </div>

          {/* Current Dependencies Display */}
          {dependencyDetails && dependencyDetails.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Current Dependencies</p>
              <div className="space-y-1 bg-blue-50 p-2 rounded text-sm">
                {dependencyDetails.map((detail) => (
                  <div key={detail} className="text-blue-700">
                    • {detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependency Input */}
          <div>
            <label htmlFor="dependencies" className="block text-sm font-medium text-gray-700 mb-2">
              Dependencies
            </label>
            <input
              id="dependencies"
              type="text"
              value={dependenciesInput}
              onChange={(e) => {
                setDependenciesInput(e.target.value)
                setValidationError(null)
              }}
              placeholder="e.g., task-1, task-2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter comma-separated task IDs (e.g., task-1, task-2)
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t px-6 py-4 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
