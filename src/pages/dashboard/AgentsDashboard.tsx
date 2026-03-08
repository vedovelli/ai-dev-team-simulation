import { useMemo } from 'react'
import { useMetrics } from '../../hooks/useMetrics'
import { StatsCard } from '../../components/Dashboard/StatsCard'
import { AgentPerformanceTable } from '../../components/Dashboard/AgentPerformanceTable'
import { SimpleChart } from '../../components/Dashboard/SimpleChart'
import { AgentStatusGrid } from '../../components/AgentStatusPanel/AgentStatusGrid'
import { ErrorBoundary } from '../../components/ErrorBoundary'

export function AgentsDashboard() {
  const { summary, timeSeriesData, agentMetrics, isLoading, error } = useMetrics()

  const icons = useMemo(
    () => ({
      tasks: '📊',
      time: '⏱️',
      agents: '👥',
    }),
    []
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Agent Performance Dashboard</h1>
          <p className="text-slate-400 mt-2">Monitor agent metrics and performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-700/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Agent Performance Dashboard</h1>
          <p className="text-slate-400 mt-2">Monitor agent metrics and performance</p>
        </div>
        <div className="rounded-lg bg-red-900/30 border border-red-700 p-6">
          <h3 className="font-semibold text-red-300 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-200">
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Agent Performance Dashboard</h1>
        <p className="text-slate-400 mt-2">Monitor agent metrics and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={icons.tasks}
          label="Total Tasks"
          value={summary?.totalTasks || 0}
          subtitle="Completed across all agents"
        />
        <StatsCard
          icon={icons.time}
          label="Avg Completion Time"
          value={`${summary?.averageCompletionTime || 0}m`}
          subtitle="Average time per task"
        />
        <StatsCard
          icon={icons.agents}
          label="Active Agents"
          value={summary?.activeAgents || 0}
          subtitle="Currently available agents"
        />
      </div>

      {/* Agent Status Grid - Real-time Status Dashboard */}
      <ErrorBoundary>
        <AgentStatusGrid />
      </ErrorBoundary>

      {/* Performance Chart */}
      <ErrorBoundary>
        <SimpleChart
          data={timeSeriesData || []}
          title="Task Completion Trend (Last 24 Hours)"
          yAxisLabel="Tasks"
        />
      </ErrorBoundary>

      {/* Agent Table */}
      <ErrorBoundary>
        <AgentPerformanceTable data={agentMetrics || []} isLoading={isLoading} />
      </ErrorBoundary>
    </div>
  )
}
