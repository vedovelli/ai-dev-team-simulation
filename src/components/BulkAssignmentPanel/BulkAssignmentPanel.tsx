import { useState } from 'react'
import { useBulkAssignment } from '../../hooks/useBulkAssignment'
import { AgentCapacityCards } from '../AgentCapacityCards'
import type { Task } from '../../types/task'

interface BulkAssignmentPanelProps {
  tasks: Task[]
  onAssignmentComplete?: () => void
  onError?: (error: string) => void
}

export function BulkAssignmentPanel({
  tasks,
  onAssignmentComplete,
  onError,
}: BulkAssignmentPanelProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [showOverrideWarning, setShowOverrideWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { assignBulk, isPending, isLoadingCapacity, capacityData } = useBulkAssignment()

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTaskIds(newSelected)
  }

  const toggleAllTasks = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set())
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)))
    }
  }

  const handleAssignment = async (skipValidation = false) => {
    if (selectedTaskIds.size === 0 || !selectedAgentId) {
      onError?.('Please select tasks and an agent')
      return
    }

    try {
      setIsSubmitting(true)
      const results = await assignBulk(
        {
          taskIds: Array.from(selectedTaskIds),
          agentId: selectedAgentId,
        },
        { skipValidation }
      )

      const failedCount = results.filter((r) => !r.success).length
      if (failedCount > 0) {
        onError?.(`${failedCount} of ${results.length} assignments failed`)
      } else {
        setSelectedTaskIds(new Set())
        setSelectedAgentId('')
        setShowOverrideWarning(false)
        onAssignmentComplete?.()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assignment failed'
      if (message.includes('Cannot assign')) {
        setShowOverrideWarning(true)
      } else {
        onError?.(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedAgent = selectedAgentId ? capacityData[selectedAgentId] : null
  const projectedLoad = selectedAgent
    ? selectedAgent.currentTasks + selectedTaskIds.size
    : selectedTaskIds.size

  return (
    <div className="space-y-6">
      {/* Task Selection Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Select Tasks</h3>
          <span className="text-sm text-slate-600">
            {selectedTaskIds.size} of {tasks.length} selected
          </span>
        </div>

        {/* Select All Checkbox */}
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedTaskIds.size === tasks.length && tasks.length > 0}
            onChange={toggleAllTasks}
            className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          />
          <span className="font-medium text-slate-700">Select All ({tasks.length} tasks)</span>
        </label>

        {/* Task List */}
        <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No tasks available</p>
          ) : (
            tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTaskIds.has(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  className="w-4 h-4 rounded border-slate-300 cursor-pointer mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                  <p className="text-xs text-slate-600">
                    {task.id} • Priority: {task.priority}
                    {task.estimatedHours && ` • ${task.estimatedHours}h`}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Agent Selection Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Select Agent</h3>
        <AgentCapacityCards
          capacityData={capacityData}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          isLoading={isLoadingCapacity}
        />
      </div>

      {/* Assignment Preview */}
      {selectedAgent && selectedTaskIds.size > 0 && (
        <div className={`p-4 rounded-lg border-2 ${
          projectedLoad > selectedAgent.maxTasks
            ? 'border-red-200 bg-red-50'
            : projectedLoad >= selectedAgent.maxTasks * 0.8
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
        }`}>
          <p className="text-sm font-medium text-slate-900">
            Assignment Preview: {selectedAgent.name}
          </p>
          <p className="text-sm text-slate-700 mt-1">
            Current: {selectedAgent.currentTasks} tasks → Projected: {projectedLoad} tasks
            (max: {selectedAgent.maxTasks})
          </p>
          {projectedLoad > selectedAgent.maxTasks && (
            <p className="text-sm text-red-700 font-medium mt-2">
              ⚠️ This assignment will exceed capacity!
            </p>
          )}
        </div>
      )}

      {/* Over-Capacity Warning Modal */}
      {showOverrideWarning && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Capacity Warning</h2>
            <p className="text-sm text-slate-600 mb-4">
              Assigning {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} to{' '}
              <strong>{selectedAgent.name}</strong> will exceed their capacity ({projectedLoad} of{' '}
              {selectedAgent.maxTasks} tasks).
            </p>
            <p className="text-sm text-slate-600 mb-6">
              Do you want to proceed anyway?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOverrideWarning(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignment(true)}
                disabled={isSubmitting || isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting || isPending ? 'Assigning...' : 'Proceed Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={() => handleAssignment()}
          disabled={
            selectedTaskIds.size === 0 ||
            !selectedAgentId ||
            isSubmitting ||
            isPending
          }
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || isPending ? 'Assigning...' : 'Assign Tasks'}
        </button>
        <button
          onClick={() => {
            setSelectedTaskIds(new Set())
            setSelectedAgentId('')
            setShowOverrideWarning(false)
          }}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
