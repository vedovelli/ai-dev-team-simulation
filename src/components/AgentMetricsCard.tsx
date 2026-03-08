import type { AgentMetrics } from '../types/metrics'

interface AgentMetricsCardProps {
  metric: AgentMetrics
  variant?: 'compact' | 'detailed'
}

/**
 * Individual metric display card for an agent
 * Shows key performance indicators with visual indicators
 */
export function AgentMetricsCard({
  metric,
  variant = 'compact',
}: AgentMetricsCardProps) {
  const performanceTierColors = {
    excellent: 'bg-green-900 border-green-700 text-green-200',
    good: 'bg-blue-900 border-blue-700 text-blue-200',
    average: 'bg-yellow-900 border-yellow-700 text-yellow-200',
    'below-average': 'bg-red-900 border-red-700 text-red-200',
  }

  const performanceTierBadgeColors = {
    excellent: 'bg-green-600',
    good: 'bg-blue-600',
    average: 'bg-yellow-600',
    'below-average': 'bg-red-600',
  }

  const tierColor = performanceTierColors[metric.performanceTier]
  const badgeColor = performanceTierBadgeColors[metric.performanceTier]

  const lastActivity = new Date(metric.lastActivityAt)
  const hoursAgo = Math.floor(
    (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60)
  )

  if (variant === 'detailed') {
    return (
      <div className={`p-4 rounded-lg border ${tierColor}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{metric.agentName}</h3>
            <p className="text-sm opacity-75">{metric.agentRole}</p>
          </div>
          <span
            className={`${badgeColor} px-3 py-1 rounded-full text-xs font-medium text-white`}
          >
            {metric.performanceTier.replace('-', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricField
            label="Tasks Completed"
            value={metric.completedTasks}
            total={metric.totalTasks}
          />
          <MetricField
            label="Success Rate"
            value={`${metric.successRate}%`}
          />
          <MetricField
            label="Avg Time"
            value={`${metric.averageTimeToComplete}m`}
          />
          <MetricField label="Error Rate" value={`${metric.errorRate}%`} />
          <MetricField label="In Progress" value={metric.inProgressTasks} />
          <MetricField label="Failed" value={metric.failedTasks} />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-600 text-xs opacity-70">
          Last active {hoursAgo}h ago
        </div>
      </div>
    )
  }

  // Compact variant
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700 rounded border border-slate-600">
      <div className="flex-1">
        <p className="font-medium text-sm">{metric.agentName}</p>
        <p className="text-xs text-slate-400">{metric.agentRole}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold">{metric.completedTasks}</p>
          <p className="text-xs text-slate-400">completed</p>
        </div>
        <span
          className={`${badgeColor} px-2 py-1 rounded text-xs font-medium text-white`}
        >
          {metric.successRate}%
        </span>
      </div>
    </div>
  )
}

interface MetricFieldProps {
  label: string
  value: string | number
  total?: number
}

function MetricField({ label, value, total }: MetricFieldProps) {
  return (
    <div>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="font-semibold">
        {value}
        {total && <span className="text-xs opacity-70">/{total}</span>}
      </p>
    </div>
  )
}
