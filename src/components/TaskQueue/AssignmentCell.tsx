import React, { useState } from 'react'
import type { Agent } from '../../types/agent'
import type { Task } from '../../types/task'

export interface AssignmentCellProps {
  task: Task
  agents: Agent[]
  isEditing: boolean
  onAssignmentChange: (taskId: string, agentId: string) => Promise<void>
  onEditToggle: (taskId: string, isEditing: boolean) => void
  isLoading?: boolean
}

/**
 * Inline assignment editor for task-to-agent assignment.
 * Allows quick assignment from a dropdown with validation feedback.
 */
export function AssignmentCell({
  task,
  agents,
  isEditing,
  onAssignmentChange,
  onEditToggle,
  isLoading = false,
}: AssignmentCellProps) {
  const [error, setError] = useState<string | null>(null)
  const currentAgent = agents.find((a) => a.id === task.assignee)

  const handleAssign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentId = e.target.value
    setError(null)

    try {
      await onAssignmentChange(task.id, agentId)
      onEditToggle(task.id, false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assignment failed'
      setError(message)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <select
          value={task.assignee || ''}
          onChange={handleAssign}
          disabled={isLoading}
          className="w-full px-2 py-1 bg-slate-700 text-slate-200 rounded border border-slate-600 text-sm disabled:opacity-50"
          autoFocus
        >
          <option value="">Select agent...</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.role})
            </option>
          ))}
        </select>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>
    )
  }

  return (
    <button
      onClick={() => onEditToggle(task.id, true)}
      className="text-slate-300 hover:text-slate-100 text-sm py-1 px-2 rounded hover:bg-slate-700 transition-colors"
      disabled={isLoading}
    >
      {currentAgent ? currentAgent.name : 'Unassigned'}
    </button>
  )
}
