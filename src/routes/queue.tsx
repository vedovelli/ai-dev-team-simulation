import { useMemo, Suspense, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { useQuery } from '@tanstack/react-query'
import { useTable } from '../hooks/useTable'
import type { Task } from '../types/task'
import type { Agent } from '../types/agent'
import { RouteErrorBoundary } from '../components/RouteErrorBoundary'
import { PriorityBadge } from '../components/Queue/PriorityBadge'
import { DeadlineIndicator } from '../components/Queue/DeadlineIndicator'
import { AgentWorkloadCard } from '../components/Queue/AgentWorkloadCard'
import { QueueEmptyState } from '../components/Queue/QueueEmptyState'

async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch('/api/agents')
  if (!response.ok) throw new Error('Failed to fetch agents')
  const data = await response.json()
  return data.data || []
}

/* eslint-disable react-refresh/only-export-components */
function QueueRoute() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  })

  // Filter state for agent workload
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | string>('all')

  // Calculate agent workloads
  const agentWorkloads = useMemo(() => {
    const workloads: Record<string, { agent: Agent; assigned: number; inProgress: number }> = {}

    agents.forEach((agent) => {
      workloads[agent.id] = {
        agent,
        assigned: tasks.filter((t) => t.assignee === agent.name).length,
        inProgress: tasks.filter((t) => t.assignee === agent.name && t.status === 'in-progress').length,
      }
    })

    return workloads
  }, [tasks, agents])

  // Filter tasks based on selection
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

    if (filterType === 'unassigned') {
      filtered = filtered.filter((t) => !t.assignee || t.assignee === '')
    } else if (filterType !== 'all') {
      // Filter by specific agent
      filtered = filtered.filter((t) => t.assignee === filterType)
    }

    return filtered
  }, [tasks, filterType])

  // Sort by priority (high to low) then deadline (earliest first)
  const priorityOrder: Record<string, number> = {
    high: 1,
    medium: 2,
    low: 3,
  }

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
      if (priorityDiff !== 0) return priorityDiff

      const aDeadline = a.createdAt ? new Date(a.createdAt).getTime() : Infinity
      const bDeadline = b.createdAt ? new Date(b.createdAt).getTime() : Infinity
      return aDeadline - bDeadline
    })
  }, [filteredTasks])

  const { sortedAndFilteredData } = useTable({
    data: sortedTasks,
  })

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Task Queue</h1>
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-600">Loading queue...</p>
          </div>
        </div>
      </div>
    )
  }

  const hasUnassignedTasks = tasks.some((t) => !t.assignee || t.assignee === '')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Queue</h1>
          <p className="mt-2 text-gray-600">
            Manage and assign tasks based on agent workload
          </p>
        </div>

        {/* Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters and Workload - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filter Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Filter Tasks
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tasks</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Agent Workload Cards */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Agent Workload</h2>
              <div className="space-y-3">
                {agents.map((agent) => {
                  const workload = agentWorkloads[agent.id]
                  return (
                    <AgentWorkloadCard
                      key={agent.id}
                      agent={agent}
                      totalTasks={workload.assigned}
                      inProgressTasks={workload.inProgress}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Queue Table - Right Column */}
          <div className="lg:col-span-3">
            {sortedAndFilteredData.length === 0 ? (
              <QueueEmptyState filterType={filterType} />
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                          Assignee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                          Deadline
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAndFilteredData.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {task.title}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {task.assignee || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <DeadlineIndicator createdAt={task.createdAt} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                  Showing {sortedAndFilteredData.length} of {tasks.length} tasks
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QueueRouteWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Queue</h1>
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400">Loading queue...</p>
            </div>
          </div>
        </div>
      }
    >
      <QueueRoute />
    </Suspense>
  )
}

export const Route = createFileRoute('/queue')({
  component: QueueRouteWrapper,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
