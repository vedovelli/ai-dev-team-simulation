import { useState } from 'react'
import { useAgentMetrics, type TimeRange } from '../../hooks/useAgentMetrics'
import { AgentLeaderboard } from '../../components/AgentMetrics/AgentLeaderboard'

export function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const { data: metrics, isLoading, error } = useAgentMetrics({ timeRange })

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all-time', label: 'All Time' },
  ]

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Agent Performance Dashboard
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Real-time metrics and leaderboard for all agents
          </p>
        </header>

        {/* Time Range Selector */}
        <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                timeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        {!isLoading && !error && metrics && metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Tasks */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <p className="text-slate-600 text-sm font-medium mb-1">Total Tasks Completed</p>
              <p className="text-3xl font-bold text-slate-900">
                {metrics.reduce((sum, m) => sum + m.completedTasks, 0)}
              </p>
            </div>

            {/* Avg Success Rate */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <p className="text-slate-600 text-sm font-medium mb-1">Avg Success Rate</p>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(
                  metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length
                )}
                %
              </p>
            </div>

            {/* Active Agents */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <p className="text-slate-600 text-sm font-medium mb-1">Total Agents</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.length}</p>
            </div>

            {/* Avg Response Time */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
              <p className="text-slate-600 text-sm font-medium mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(
                  metrics.reduce((sum, m) => sum + m.averageTimeToComplete, 0) / metrics.length
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">minutes</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Agent Leaderboard</h2>
          <AgentLeaderboard metrics={metrics || []} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  )
}
