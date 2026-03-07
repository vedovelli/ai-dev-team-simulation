import { useSprintMetrics } from '../../hooks/useSprintMetrics'
import { MetricCard } from './MetricCard'

interface SprintMetricsPanelProps {
  sprintId: string
  /** Custom polling interval in milliseconds (default: 30000) */
  refetchInterval?: number
}

/**
 * Sprint Metrics Panel component
 *
 * Displays key sprint metrics including task counts, velocity, burndown data,
 * and completion rate. Automatically polls for updates every 30 seconds.
 *
 * Features:
 * - Real-time metric polling
 * - Graceful error handling with retry
 * - Loading states during data fetch
 * - Responsive grid layout
 */
export function SprintMetricsPanel({ sprintId, refetchInterval = 30 * 1000 }: SprintMetricsPanelProps) {
  const {
    data,
    isLoading,
    error,
    isFetching,
    metrics,
  } = useSprintMetrics(sprintId, { refetchInterval })

  if (!sprintId) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No sprint selected</p>
      </div>
    )
  }

  // Error state with no data
  if (error && !data) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
        <p className="font-semibold mb-2">Error loading metrics</p>
        <p className="text-sm mb-4">{error.message}</p>
      </div>
    )
  }

  // Loading state with no data
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <MetricCard
            key={idx}
            label="Loading..."
            value="—"
            isLoading={true}
          />
        ))}
      </div>
    )
  }

  // No data available
  if (!metrics) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No metrics available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Completion Rate */}
      <MetricCard
        label="Completion Rate"
        value={metrics.completionPercentage}
        unit="%"
        color="blue"
        trend={metrics.completionPercentage >= 50 ? 'up' : 'neutral'}
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* Completed Tasks */}
      <MetricCard
        label="Completed Tasks"
        value={metrics.completedTasks}
        unit={`of ${metrics.totalTasks}`}
        color="green"
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* Remaining Tasks */}
      <MetricCard
        label="Remaining Tasks"
        value={metrics.remainingTasks}
        unit="tasks"
        color="yellow"
        trend={metrics.remainingTasks <= 2 ? 'up' : 'neutral'}
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* In Progress */}
      <MetricCard
        label="In Progress"
        value={metrics.inProgressTasks}
        unit="tasks"
        color="purple"
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* Tasks Per Day (Velocity) */}
      <MetricCard
        label="Task Velocity"
        value={metrics.tasksPerDay.toFixed(1)}
        unit="tasks/day"
        color="green"
        trend="up"
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* Average Completion Time */}
      <MetricCard
        label="Avg. Completion Time"
        value={metrics.averageTaskCompletionTime}
        unit="hours"
        color="blue"
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* Projected Completion */}
      <MetricCard
        label="Projected Completion"
        value={
          metrics.projectedCompletionDate
            ? new Date(metrics.projectedCompletionDate).toLocaleDateString()
            : 'N/A'
        }
        color={metrics.projectedCompletionDate ? 'green' : 'slate'}
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />

      {/* Total Sprint Points */}
      <MetricCard
        label="Total Tasks"
        value={metrics.totalTasks}
        unit="tasks"
        color="slate"
        isLoading={isLoading && isFetching}
        hasError={!!error}
      />
    </div>
  )
}
