import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAgentAnalytics } from '../../hooks/useAgentAnalytics'
import { MetricsCard } from './MetricsCard'
import { TaskHistoryTable } from './TaskHistoryTable'
import { AnalyticsFilters } from './AnalyticsFilters'
import type { Task } from '../../types/task'

interface AgentAnalyticsProps {
  agentId: string
}

interface PaginatedTasksResponse {
  data: Task[]
  total: number
  pageIndex: number
  pageSize: number
}

type AnalyticsSearch = {
  sprint?: string
  status?: string
}

export function AgentAnalytics({ agentId }: AgentAnalyticsProps) {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '__root__' }) as AnalyticsSearch
  const [pageIndex, setPageIndex] = useState(0)

  const currentSprint = searchParams.sprint || ''
  const currentStatus = searchParams.status || ''
  const pageSize = 20

  // Fetch analytics metrics
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAgentAnalytics(agentId)

  // Fetch paginated tasks for this agent
  const queryString = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString(),
    ...(currentSprint && { sprint: currentSprint }),
    ...(currentStatus && { status: currentStatus }),
  }).toString()

  const { data: tasksResponse, isLoading: tasksLoading } = useQuery<PaginatedTasksResponse, Error>({
    queryKey: ['agentTasks', agentId, pageIndex, currentSprint, currentStatus],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/tasks?${queryString}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent tasks')
      }
      return response.json()
    },
    enabled: !!agentId,
  })

  if (analyticsError) {
    return (
      <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-red-200">
        Error: {analyticsError.message}
      </div>
    )
  }

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">No analytics data available</p>
      </div>
    )
  }

  const metrics = analytics.metrics
  const tasks = tasksResponse?.data || []
  const totalPages = tasksResponse ? Math.ceil(tasksResponse.total / pageSize) : 0

  const handleSprintChange = (sprint: string | null) => {
    setPageIndex(0)
    navigate({
      search: { sprint: sprint || undefined, status: currentStatus || undefined },
    })
  }

  const handleStatusChange = (status: string | null) => {
    setPageIndex(0)
    navigate({
      search: { sprint: currentSprint || undefined, status: status || undefined },
    })
  }

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h1 className="text-3xl font-bold mb-2">{analytics.agentName}</h1>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            {analytics.agentRole}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          label="Total Tasks"
          value={metrics.totalTasks}
          trend="neutral"
        />
        <MetricsCard
          label="Completed"
          value={metrics.completedTasks}
          subtext={`${metrics.completionRate}% completion rate`}
          trend="up"
        />
        <MetricsCard
          label="Failed"
          value={metrics.failedTasks}
          subtext={`${metrics.errorRate}% error rate`}
          trend={parseInt(metrics.errorRate) > 20 ? 'down' : 'neutral'}
        />
        <MetricsCard
          label="In Progress"
          value={metrics.inProgressTasks}
          subtext={`${metrics.averageTimeToComplete}m avg`}
          trend="neutral"
        />
      </div>

      {/* Filters */}
      <AnalyticsFilters
        sprints={['sprint-1', 'sprint-2', 'sprint-3']}
        onSprintChange={handleSprintChange}
        onStatusChange={handleStatusChange}
      />

      {/* Task History Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold">Task History</h2>
          <p className="text-slate-400 mt-1">
            {tasksResponse?.total || 0} task{tasksResponse?.total !== 1 ? 's' : ''}
          </p>
        </div>

        <TaskHistoryTable tasks={tasks} isLoading={tasksLoading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
            <button
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={pageIndex === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              ← Previous
            </button>

            <span className="text-sm text-slate-400">
              Page {pageIndex + 1} of {totalPages}
            </span>

            <button
              onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
