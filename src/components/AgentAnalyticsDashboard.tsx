import { useState } from 'react'
import { useAgentAnalytics } from '../hooks/useAgentAnalytics'
import { AgentMetricsCard } from './AgentMetricsCard'
import { AgentComparisonTable } from './AgentComparisonTable'
import { AgentTrendChart } from './AgentTrendChart'

/**
 * Comprehensive dashboard showing agent productivity metrics over time
 * Features time-range filtering, metrics cards, comparison table, and trend charts
 */
export function AgentAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const { data, isLoading, error } = useAgentAnalytics(timeRange)

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-red-200">
        <p className="font-semibold mb-1">Error loading analytics dashboard</p>
        <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading analytics dashboard...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">No analytics data available</p>
      </div>
    )
  }

  const { metrics, trendData } = data

  // Calculate summary metrics
  const totalAgents = metrics.length
  const avgSuccessRate = Math.round(
    metrics.reduce((sum, m) => sum + m.successRate, 0) / totalAgents
  )
  const avgCompletionTime = Math.round(
    metrics.reduce((sum, m) => sum + m.averageTimeToComplete, 0) / totalAgents
  )

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Performance Analytics</h1>
          <p className="text-slate-400 mt-1">
            Track agent productivity and performance trends
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Total Agents</p>
          <p className="text-3xl font-bold">{totalAgents}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Avg Success Rate</p>
          <p className="text-3xl font-bold">{avgSuccessRate}%</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Avg Completion Time</p>
          <p className="text-3xl font-bold">{avgCompletionTime}m</p>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <AgentTrendChart data={trendData} height={350} />
      )}

      {/* Comparison Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Agent Comparison</h2>
        <AgentComparisonTable data={metrics} />
      </div>

      {/* Detailed Metrics Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Detailed Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <AgentMetricsCard
              key={metric.agentId}
              metric={metric}
              variant="detailed"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
