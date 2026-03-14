import { useRef, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AgentMetrics } from '../../types/metrics'
import type { Task } from '../../types/task'
import { useTaskAssignment } from '../../hooks/useTaskAssignment'
import { MutationStatus } from '../MutationStatus'

interface TaskSelectorModalProps {
  agent: AgentMetrics
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal that allows selecting a task to assign to an agent
 * Fetches unassigned tasks from current sprint
 */
export function TaskSelectorModal({
  agent,
  isOpen,
  onClose,
}: TaskSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'unassigned'],
    queryFn: async () => {
      const response = await fetch('/api/tasks?assignee=&status=backlog,in-progress')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json() as Promise<Task[]>
    },
    enabled: isOpen,
  })

  const { assign, isPending, assignmentError } = useTaskAssignment({
    onAssignSuccess: () => {
      setShowSuccess(true)
      setTimeout(() => {
        onClose()
        setShowSuccess(false)
        setSelectedTaskId(null)
      }, 1500)
    },
  })

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleAssign = () => {
    if (!selectedTaskId) return
    assign({ taskId: selectedTaskId, agentId: agent.agentId })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-slate-200">
              Assign Task
            </h2>
            <p className="text-sm text-slate-400 mt-1">to {agent.agentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-400">Loading available tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-400 text-center">No unassigned tasks available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full text-left px-4 py-3 rounded border-2 transition-all ${
                    selectedTaskId === task.id
                      ? 'bg-blue-900 border-blue-600 text-blue-100'
                      : 'bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="text-xs mt-1 opacity-70">{task.id}</p>
                    </div>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        task.priority === 'high'
                          ? 'bg-red-900 text-red-200'
                          : task.priority === 'medium'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-slate-600 text-slate-200'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Error message */}
          {assignmentError && (
            <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
              {assignmentError instanceof Error
                ? assignmentError.message
                : 'Failed to assign task'}
            </div>
          )}

          {/* Success message */}
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded text-green-200 text-sm">
              ✓ Task assigned successfully
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTaskId || isPending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
          >
            {isPending ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}
