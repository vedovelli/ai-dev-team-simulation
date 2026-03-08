import { useState } from 'react'
import { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard'
import { useAgentUtilizationData } from '../hooks/useAgentUtilizationData'
import { useSprintVelocityData } from '../hooks/useSprintVelocityData'
import { useTaskDistribution } from '../hooks/useTaskDistribution'
import { AgentUtilizationChart } from './AgentUtilizationChart'
import { SprintVelocityChart } from './SprintVelocityChart'
import { TaskDistributionTable } from './TaskDistributionTable'
import type { AnalyticsFilters } from '../types/analytics'

interface AnalyticsDashboardProps {
  sprintId?: string
}

/**
 * Analytics Dashboard
 * Comprehensive view of agent performance, sprint metrics, and task distribution
 * Features time range selector, export to CSV, and virtualized data tables
 */
export function AnalyticsDashboard({ sprintId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d')
  const [taskPage, setTaskPage] = useState(1)
  const [taskSort, setTaskSort] = useState({ sortBy: 'completedAt', sortOrder: 'desc' as const })

  const filters: AnalyticsFilters = {
    timeRange,
    ...(sprintId && { agentId: sprintId }),
  }

  // Fetch all analytics data
  const dashboardQuery = useAnalyticsDashboard(filters)
  const utilizationQuery = useAgentUtilizationData({ timeRange, granularity: 'daily' })
  const velocityQuery = useSprintVelocityData({ timeRange })
  const taskDistributionQuery = useTaskDistribution({
    ...filters,
    page: taskPage,
    pageSize: 50,
    sortBy: taskSort.sortBy as any,
    sortOrder: taskSort.sortOrder,
  })

  const isLoading =
    dashboardQuery.isLoading ||
    utilizationQuery.isLoading ||
    velocityQuery.isLoading ||
    taskDistributionQuery.isLoading

  const isError =
    dashboardQuery.isError ||
    utilizationQuery.isError ||
    velocityQuery.isError ||
    taskDistributionQuery.isError

  if (isError) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg">
        <h2 className="text-lg font-semibold text-red-300 mb-2">Error Loading Analytics</h2>
        <p className="text-red-200 text-sm">
          Failed to load analytics data. Please try again later.
        </p>
      </div>
    )
  }

  // Handle CSV export
  const handleExportCSV = () => {
    if (!taskDistributionQuery.data) return

    const csvData = taskDistributionQuery.data.items.map((item) => ({
      'Task ID': item.id,
      Title: item.title,
      Priority: item.priority,
      Status: item.status,
      'Assigned To': item.agentName,
      Duration: item.duration || '-',
      'Completed Date': item.completedAt || 'In Progress',
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">
          Comprehensive view of agent performance, sprint metrics, and task distribution
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range)
                setTaskPage(1)
              }}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isLoading || !taskDistributionQuery.data}
          className="px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Export to CSV
        </button>
      </div>

      {/* Summary Stats */}
      {dashboardQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Agents"
            value={dashboardQuery.data.summary.totalAgents}
            isLoading={isLoading}
          />
          <StatCard
            label="Active Agents"
            value={dashboardQuery.data.summary.activeAgents}
            isLoading={isLoading}
          />
          <StatCard
            label="Avg Completion Rate"
            value={`${dashboardQuery.data.summary.averageCompletionRate}%`}
            isLoading={isLoading}
          />
          <StatCard
            label="Tasks Completed"
            value={dashboardQuery.data.summary.totalTasksCompleted}
            isLoading={isLoading}
          />
          <StatCard
            label="Overall Velocity"
            value={dashboardQuery.data.summary.overallVelocity.toFixed(1)}
            isLoading={isLoading}
          />
          <StatCard
            label="Avg Duration (h)"
            value={dashboardQuery.data.summary.avgTaskDuration.toFixed(1)}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Agent Utilization Chart */}
      {utilizationQuery.data && (
        <AgentUtilizationChart
          data={utilizationQuery.data}
          height={350}
        />
      )}

      {/* Sprint Velocity Chart */}
      {velocityQuery.data && (
        <SprintVelocityChart
          sprints={velocityQuery.data}
          height={350}
        />
      )}

      {/* Task Distribution Table */}
      {taskDistributionQuery.data && (
        <TaskDistributionTable
          data={taskDistributionQuery.data.items}
          total={taskDistributionQuery.data.total}
          page={taskPage}
          pageSize={taskDistributionQuery.data.pageSize}
          onPageChange={setTaskPage}
          onSort={(sortBy, sortOrder) => {
            setTaskSort({ sortBy, sortOrder })
            setTaskPage(1)
          }}
          isLoading={isLoading}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center rounded-lg">
          <div className="bg-slate-900 px-8 py-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-slate-300">Loading analytics data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  isLoading?: boolean
}

function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      {isLoading ? (
        <div className="h-8 bg-slate-700 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
    </div>
  )
}
