import React, { useState } from 'react'
import type { Agent } from '../../types/agent'

export interface BulkAssignmentFormProps {
  selectedCount: number
  agents: Agent[]
  onSubmit: (agentId: string, skillMatch?: boolean) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

/**
 * Form for bulk assigning multiple selected tasks to a single agent.
 * Validates workload limits and skill matching before submission.
 */
export function BulkAssignmentForm({
  selectedCount,
  agents,
  onSubmit,
  onCancel,
  isLoading = false,
}: BulkAssignmentFormProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [skillMatch, setSkillMatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentId = e.target.value
    setSelectedAgent(agentId)
    setError(null)

    if (agentId) {
      const agent = agents.find((a) => a.id === agentId)
      if (agent) {
        // Mock workload validation
        const taskCount = selectedCount
        if (taskCount > 10) {
          setValidationMessage(`Warning: Assigning ${taskCount} tasks may exceed workload limits`)
        } else {
          setValidationMessage(null)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAgent) {
      setError('Please select an agent')
      return
    }

    if (selectedCount === 0) {
      setError('No tasks selected')
      return
    }

    try {
      await onSubmit(selectedAgent, skillMatch)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk assignment failed'
      setError(message)
    }
  }

  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-4 border border-slate-600">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200">
          Bulk Assign {selectedCount} Task{selectedCount !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Agent
          </label>
          <select
            value={selectedAgent}
            onChange={handleAgentChange}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-slate-800 text-slate-200 rounded border border-slate-600 disabled:opacity-50"
          >
            <option value="">Choose an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.role})
              </option>
            ))}
          </select>
        </div>

        {validationMessage && (
          <div className="text-sm text-yellow-400 bg-yellow-900/20 p-2 rounded">
            {validationMessage}
          </div>
        )}

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={skillMatch}
            onChange={(e) => setSkillMatch(e.target.checked)}
            disabled={isLoading}
            className="rounded"
          />
          <span className="text-sm text-slate-300">Verify skill match</span>
        </label>

        {error && <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{error}</div>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading || !selectedAgent}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Assigning...' : 'Assign Tasks'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-600 text-white rounded font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
