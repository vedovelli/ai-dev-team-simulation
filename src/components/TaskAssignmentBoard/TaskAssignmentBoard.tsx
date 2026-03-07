import { useCallback, useMemo, useState } from 'react'
import type { Task } from '../../types/task'
import type { AgentManagement } from '../../types/agent'
import { useTasks } from '../../hooks/queries/tasks'
import { useAgents } from '../../hooks/useAgents'
import { useTaskAssignment } from '../../hooks/mutations/useTaskAssignment'
import { SearchInput } from '../SearchInput'

interface TaskAssignmentBoardProps {
  sprintId?: string
  maxAgentCapacity?: number
}

const AGENT_DEFAULT_CAPACITY = 5

/**
 * Task Assignment Board Component
 *
 * Displays tasks in a table with:
 * - Task name, status, assigned agent
 * - Dropdown for reassignment with capacity indicators
 * - Agent filtering
 * - Optimistic updates with error handling
 */
export function TaskAssignmentBoard({
  sprintId,
  maxAgentCapacity = AGENT_DEFAULT_CAPACITY,
}: TaskAssignmentBoardProps) {
  const [filterValue, setFilterValue] = useState('')
  const [agentFilter, setAgentFilter] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Fetch tasks and agents
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    error: tasksError,
  } = useTasks({
    sprint: sprintId,
  })

  const {
    data: agents = [],
    isLoading: agentsLoading,
    error: agentsError,
  } = useAgents()

  const { mutate: assignTasks, isPending: isAssigning } = useTaskAssignment()

  // Get task list
  const tasks = useMemo(() => tasksResponse?.data ?? [], [tasksResponse])

  // Calculate agent capacity
  const agentCapacity = useMemo(() => {
    const capacity: Record<string, number> = {}
    tasks.forEach((task) => {
      if (task.assignee) {
        capacity[task.assignee] = (capacity[task.assignee] || 0) + 1
      }
    })
    return capacity
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        filterValue === '' ||
        task.title.toLowerCase().includes(filterValue.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(filterValue.toLowerCase())

      const matchesAgent =
        agentFilter === null ||
        agentFilter === '' ||
        task.assignee === agentFilter ||
        (agentFilter === '__unassigned' && !task.assignee)

      return matchesSearch && matchesAgent
    })
  }, [tasks, filterValue, agentFilter])

  // Handle assignment
  const handleAssign = useCallback(
    (taskId: string, agentId: string) => {
      // Check capacity before assigning
      const currentCapacity = agentCapacity[agentId] || 0
      if (currentCapacity >= maxAgentCapacity) {
        // In a real app, show toast error
        console.error(
          `Agent ${agentId} is at capacity (${currentCapacity}/${maxAgentCapacity})`
        )
        return
      }

      assignTasks(
        {
          taskIds: [taskId],
          data: {
            agentId,
            priority: 2, // default to medium
            estimatedHours: 4, // default estimate
          },
        },
        {
          onSuccess: () => {
            setSelectedTaskId(null)
          },
          onError: (error) => {
            console.error('Assignment failed:', error)
            // In a real app, show toast error
          },
        }
      )
    },
    [assignTasks, agentCapacity, maxAgentCapacity]
  )

  const isLoading = tasksLoading || agentsLoading
  const hasError = tasksError || agentsError

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-200">Task Assignment Board</h2>
        <div className="text-sm text-slate-400">
          {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-4 text-red-400 text-sm">
          Failed to load data. Please refresh the page.
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search tasks or agents..."
            value={filterValue}
            onChange={setFilterValue}
          />
        </div>

        <select
          value={agentFilter ?? ''}
          onChange={(e) => setAgentFilter(e.target.value || null)}
          className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-sm
            hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Agents</option>
          <option value="__unassigned">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agentCapacity[agent.id] || 0}/{maxAgentCapacity})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg bg-slate-800 p-8 text-center text-slate-400">
          Loading tasks...
        </div>
      ) : (
        <div className="rounded-lg bg-slate-800 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                    Task Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                    Assigned Agent
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      agents={agents}
                      agentCapacity={agentCapacity}
                      maxCapacity={maxAgentCapacity}
                      onAssign={handleAssign}
                      isAssigning={isAssigning && selectedTaskId === task.id}
                      isDropdownOpen={selectedTaskId === task.id}
                      onDropdownToggle={(open) =>
                        setSelectedTaskId(open ? task.id : null)
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      {tasks.length === 0
                        ? 'No tasks found'
                        : 'No tasks match your filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

interface TaskRowProps {
  task: Task
  agents: AgentManagement[]
  agentCapacity: Record<string, number>
  maxCapacity: number
  onAssign: (taskId: string, agentId: string) => void
  isAssigning: boolean
  isDropdownOpen: boolean
  onDropdownToggle: (open: boolean) => void
}

function TaskRow({
  task,
  agents,
  agentCapacity,
  maxCapacity,
  onAssign,
  isAssigning,
  isDropdownOpen,
  onDropdownToggle,
}: TaskRowProps) {
  const assignedAgent = agents.find((a) => a.id === task.assignee)
  const currentCapacity = agentCapacity[task.assignee] || 0
  const isAtCapacity = currentCapacity >= maxCapacity

  const statusColor = {
    backlog: 'bg-slate-600 text-slate-200',
    'in-progress': 'bg-blue-600 text-blue-100',
    'in-review': 'bg-purple-600 text-purple-100',
    done: 'bg-green-600 text-green-100',
  }[task.status] || 'bg-slate-600 text-slate-200'

  return (
    <tr className="hover:bg-slate-700/50 transition-colors">
      <td className="px-6 py-4 text-sm text-slate-300">
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-xs text-slate-400 mt-1">
            {task.storyPoints} pts {task.priority && `• ${task.priority}`}
          </p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
          {task.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {assignedAgent ? (
          <div>
            <p>{assignedAgent.name}</p>
            <p className="text-xs text-slate-400">{assignedAgent.role}</p>
          </div>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <div className="text-xs">
            {currentCapacity}/{maxCapacity}
          </div>
          {isAtCapacity && <span className="text-xs text-red-400">Full</span>}
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="relative">
          <button
            onClick={() => onDropdownToggle(!isDropdownOpen)}
            disabled={isAssigning}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-blue-100 text-xs
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAssigning ? 'Assigning...' : 'Assign'}
          </button>

          {isDropdownOpen && (
            <div
              className="absolute top-full mt-2 right-0 bg-slate-700 border border-slate-600 rounded-lg shadow-lg
              z-10 min-w-48"
            >
              {agents.length === 0 ? (
                <div className="px-4 py-2 text-sm text-slate-400">No agents available</div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {agents.map((agent) => {
                    const agentCurrentCapacity = agentCapacity[agent.id] || 0
                    const agentIsAtCapacity = agentCurrentCapacity >= maxCapacity
                    const isCurrentAssignee = task.assignee === agent.id

                    return (
                      <button
                        key={agent.id}
                        onClick={() => {
                          onAssign(task.id, agent.id)
                          onDropdownToggle(false)
                        }}
                        disabled={agentIsAtCapacity && !isCurrentAssignee}
                        className={`
                          w-full text-left px-4 py-2 text-sm transition-colors
                          ${
                            isCurrentAssignee
                              ? 'bg-blue-600/50 text-blue-100'
                              : agentIsAtCapacity
                                ? 'text-slate-500 cursor-not-allowed'
                                : 'text-slate-300 hover:bg-slate-600'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-xs opacity-75">{agent.role}</p>
                          </div>
                          <div className="text-xs opacity-75">
                            {agentCurrentCapacity}/{maxCapacity}
                            {agentIsAtCapacity && ' ⚠'}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
