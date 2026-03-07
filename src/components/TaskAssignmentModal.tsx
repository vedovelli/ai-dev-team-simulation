import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Task } from '../types/task'
import type { Agent } from '../types/agent'
import type { TaskAssignmentInput } from '../types/forms/taskAssignment'
import { taskAssignmentSchema } from '../types/forms/taskAssignment'
import type { BatchTaskAssignmentInput } from '../lib/validation'
import { batchTaskAssignmentSchema } from '../lib/validation'
import { useAssignTask } from '../hooks/mutations/useAssignTask'
import { useTaskAssignment } from '../hooks/mutations/useTaskAssignment'
import { useAgentCapacity, canAgentAcceptTasks } from '../hooks/useAgentCapacity'
import { useToastApi } from '../hooks/useToastApi'

interface TaskAssignmentModalProps {
  tasks: Task | Task[]
  agents: Agent[]
  isOpen: boolean
  onClose: () => void
}

export function TaskAssignmentModal({
  tasks,
  agents,
  isOpen,
  onClose,
}: TaskAssignmentModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { showSuccess, showError } = useToastApi()
  const { data: agentsWithCapacity = [] } = useAgentCapacity()

  // Normalize tasks to array
  const taskArray = Array.isArray(tasks) ? tasks : [tasks]
  const isBatchAssignment = taskArray.length > 1

  // Single assignment hook
  const assignTaskMutation = useAssignTask()
  // Batch assignment hook
  const batchAssignMutation = useTaskAssignment()

  // Use appropriate schema and form based on single/batch
  const validationSchema = isBatchAssignment ? batchTaskAssignmentSchema : taskAssignmentSchema

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<BatchTaskAssignmentInput>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      taskIds: taskArray.map((t) => t.id),
      agentId: !isBatchAssignment && taskArray[0].assignee !== 'Unassigned' ? taskArray[0].assignee : '',
      priority: !isBatchAssignment ? (taskArray[0].priority === 'high' ? 1 : taskArray[0].priority === 'medium' ? 2 : 3) : 2,
      estimatedHours: !isBatchAssignment ? taskArray[0].estimatedHours : undefined,
    },
  })

  const selectedAgentId = watch('agentId')
  const selectedAgent = agentsWithCapacity.find((a) => a.id === selectedAgentId || a.name === selectedAgentId)
  const canAgentAccept = selectedAgent ? canAgentAcceptTasks(selectedAgent, taskArray.length) : false

  const onSubmit = async (data: BatchTaskAssignmentInput) => {
    setErrorMessage(null)

    try {
      if (isBatchAssignment) {
        // Batch assignment
        await batchAssignMutation.mutateAsync({
          taskIds: data.taskIds,
          data: {
            agentId: data.agentId,
            priority: data.priority,
            estimatedHours: data.estimatedHours,
          },
        })
        showSuccess(`${taskArray.length} tasks assigned successfully`)
      } else {
        // Single assignment
        await assignTaskMutation.mutateAsync({
          taskId: taskArray[0].id,
          data: {
            agent: data.agentId,
            priority: data.priority,
            estimatedHours: data.estimatedHours,
          },
        })
        showSuccess('Task assigned successfully')
      }

      reset()
      onClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to assign task(s). Agent may be at capacity.'
      setErrorMessage(message)
      showError(message)
    }
  }

  const handleClose = () => {
    reset()
    setErrorMessage(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Assign Task{isBatchAssignment ? 's' : ''}</h2>
          {isBatchAssignment ? (
            <p className="text-sm text-gray-600 mb-6">
              Assign {taskArray.length} task{taskArray.length !== 1 ? 's' : ''} to an agent
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-6">{taskArray[0].title}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Agent Select */}
            <div>
              <label htmlFor="agentId" className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                id="agentId"
                {...register('agentId')}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.agentId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select an agent...</option>
                {agentsWithCapacity.map((agent) => (
                  <option
                    key={agent.id}
                    value={agent.id}
                    disabled={agent.availableSlots < taskArray.length}
                  >
                    {agent.name} ({agent.role}) - {agent.availableSlots}/{agent.maxCapacity} slots
                  </option>
                ))}
              </select>
              {errors.agentId && (
                <p className="mt-1 text-sm text-red-600">{errors.agentId.message}</p>
              )}
              {selectedAgent && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>
                    Selected: {selectedAgent.name} ({selectedAgent.role})
                  </p>
                  <p
                    className={`${
                      canAgentAccept ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    Capacity: {selectedAgent.availableSlots} of {selectedAgent.maxCapacity} slots available
                    {!canAgentAccept && ` (needs ${taskArray.length})`}
                  </p>
                </div>
              )}
            </div>

            {/* Priority Select */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register('priority', { valueAsNumber: true })}
                      value={p}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{p === 1 ? 'High' : p === 2 ? 'Med' : 'Low'}</span>
                  </label>
                ))}
              </div>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours per Task (optional)
              </label>
              <input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g., 4.5"
                {...register('estimatedHours', { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.estimatedHours ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedHours.message}</p>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  assignTaskMutation.isPending ||
                  batchAssignMutation.isPending ||
                  !canAgentAccept
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isBatchAssignment
                  ? batchAssignMutation.isPending
                    ? 'Assigning...'
                    : `Assign ${taskArray.length} Tasks`
                  : assignTaskMutation.isPending
                    ? 'Assigning...'
                    : 'Assign Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
