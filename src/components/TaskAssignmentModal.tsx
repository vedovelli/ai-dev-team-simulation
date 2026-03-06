import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Task } from '../types/task'
import type { Agent } from '../types/agent'
import type { TaskAssignmentInput } from '../types/forms/taskAssignment'
import { taskAssignmentSchema } from '../types/forms/taskAssignment'
import { useAssignTask } from '../hooks/mutations/useAssignTask'
import { useToastApi } from '../hooks/useToastApi'

interface TaskAssignmentModalProps {
  task: Task
  agents: Agent[]
  isOpen: boolean
  onClose: () => void
}

export function TaskAssignmentModal({
  task,
  agents,
  isOpen,
  onClose,
}: TaskAssignmentModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { showSuccess, showError } = useToastApi()
  const assignTaskMutation = useAssignTask()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<TaskAssignmentInput>({
    resolver: zodResolver(taskAssignmentSchema),
    defaultValues: {
      agent: task.assignee !== 'Unassigned' ? task.assignee : '',
      priority: task.priority === 'high' ? 1 : task.priority === 'medium' ? 2 : 3,
      estimatedHours: task.estimatedHours || undefined,
    },
  })

  const selectedAgent = watch('agent')

  const onSubmit = async (data: TaskAssignmentInput) => {
    setErrorMessage(null)

    try {
      await assignTaskMutation.mutateAsync({
        taskId: task.id,
        data,
      })

      showSuccess('Task assigned successfully')
      reset()
      onClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to assign task. Agent may be at capacity.'
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
          <h2 className="text-xl font-semibold mb-2">Assign Task</h2>
          <p className="text-sm text-gray-600 mb-6">{task.title}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Agent Select */}
            <div>
              <label htmlFor="agent" className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                id="agent"
                {...register('agent')}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.agent ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
              {errors.agent && (
                <p className="mt-1 text-sm text-red-600">{errors.agent.message}</p>
              )}
              {selectedAgent && (
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {agents.find((a) => a.id === selectedAgent)?.name}
                </p>
              )}
            </div>

            {/* Priority Select */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority (1-4)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((p) => (
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
                Estimated Hours (optional)
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
                disabled={isSubmitting || assignTaskMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assignTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
