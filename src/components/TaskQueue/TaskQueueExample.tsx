import React, { useState, useEffect } from 'react'
import { TaskQueueTable } from './TaskQueueTable'
import type { Task } from '../../types/task'
import type { Agent } from '../../types/agent'

/**
 * Example demonstrating TaskQueueTable component usage.
 * Shows task queue management with assignment and bulk operations.
 */
export function TaskQueueExample() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Simulate fetching task queue
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch tasks
        const tasksRes = await fetch('/api/tasks/queue')
        const tasksData = await tasksRes.json()

        // Fetch agents availability
        const agentsRes = await fetch('/api/agents/availability')
        const agentsData = await agentsRes.json()

        // Mock agents list for assignment
        const mockAgents: Agent[] = [
          {
            id: 'agent-1',
            name: 'Carlos',
            role: 'sr-dev',
            status: 'working',
            currentTask: '1',
            output: 'Working on task 1',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'agent-2',
            name: 'Ana',
            role: 'junior',
            status: 'idle',
            currentTask: '',
            output: 'Available',
            lastUpdated: new Date().toISOString(),
          },
          {
            id: 'agent-3',
            name: 'Marcus',
            role: 'pm',
            status: 'working',
            currentTask: '6',
            output: 'Managing sprint',
            lastUpdated: new Date().toISOString(),
          },
        ]

        setTasks(tasksData.data || [])
        setAgents(mockAgents)
      } catch (error) {
        console.error('Failed to load tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAssignTask = async (taskId: string, agentId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Assignment failed')
      }

      const data = await res.json()

      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, assignee: agentId } : t))
      )

      setSuccessMessage(data.message || 'Task assigned successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assignment failed'
      throw new Error(message)
    }
  }

  const handleBulkAssign = async (taskIds: string[], agentId: string) => {
    try {
      const res = await fetch('/api/tasks/assign-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds, agentId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Bulk assignment failed')
      }

      const data = await res.json()

      // Update local state
      setTasks((prev) =>
        prev.map((t) =>
          taskIds.includes(t.id) ? { ...t, assignee: agentId } : t
        )
      )

      setSuccessMessage(data.message || 'Tasks assigned successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk assignment failed'
      throw new Error(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Task Queue Management</h1>
        <p className="text-slate-400 mt-2">
          Assign tasks to agents with workload validation and bulk operations
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-300">
          {successMessage}
        </div>
      )}

      {/* Task Queue Table */}
      <TaskQueueTable
        tasks={tasks}
        agents={agents}
        isLoading={isLoading}
        onAssignTask={handleAssignTask}
        onBulkAssign={handleBulkAssign}
      />

      {/* Info Section */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-2 text-sm text-slate-400">
        <h3 className="font-semibold text-slate-200">Features Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Multi-select row selection for bulk operations</li>
          <li>Inline task assignment with validation</li>
          <li>Real-time task filtering by status, assignee, and sprint</li>
          <li>Sorting by priority, status, and other columns</li>
          <li>Bulk assignment form with workload validation</li>
          <li>Agent workload indicator with capacity warnings</li>
          <li>TanStack Query mutation patterns with optimistic updates</li>
          <li>Form validation for workload and skill matching</li>
        </ul>
      </div>
    </div>
  )
}
