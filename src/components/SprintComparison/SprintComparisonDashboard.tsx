import { useSprintComparison } from '../../hooks/useSprintComparison'
import { ComparisonMetricCard } from './ComparisonMetricCard'
import { SprintComparisonChart } from './SprintComparisonChart'

interface SprintComparisonDashboardProps {
  sprintId: string | undefined
}

/**
 * Sprint Comparison Dashboard component
 *
 * Displays current sprint metrics alongside previous sprint metrics with:
 * - Side-by-side metric cards with delta indicators
 * - Recharts bar chart comparing key metrics
 * - Loading skeletons and error states
 * - Empty state for first sprint
 */
export function SprintComparisonDashboard({ sprintId }: SprintComparisonDashboardProps) {
  const { data, isLoading, error } = useSprintComparison(sprintId)

  if (!sprintId) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No sprint selected</p>
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
        <p className="font-semibold mb-2 text-red-200">Error loading sprint comparison</p>
        <p className="text-sm text-red-300">{(error as Error).message}</p>
      </div>
    )
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        {/* Loading metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 animate-pulse"
            >
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
        {/* Loading chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-96 animate-pulse" />
      </div>
    )
  }

  // No data available
  if (!data) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No comparison data available</p>
      </div>
    )
  }

  // First sprint - no previous data
  if (data.isFirstSprint) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <p className="text-lg text-slate-400 mb-4">First sprint — no comparison available</p>
        <div className="mt-6">
          <h3 className="text-md font-semibold text-slate-300 mb-4">Current Sprint Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonMetricCard
              label="Velocity"
              currentValue={data.current.velocity.toFixed(1)}
              unit="tasks/day"
            />
            <ComparisonMetricCard
              label="Completion Rate"
              currentValue={`${data.current.completionPercentage}%`}
            />
            <ComparisonMetricCard
              label="Tasks Completed"
              currentValue={data.current.completedPoints / 3}
              unit="tasks"
            />
          </div>
        </div>
      </div>
    )
  }

  // Normal comparison view
  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Velocity Card */}
        <ComparisonMetricCard
          label="Velocity"
          currentValue={data.current.velocity.toFixed(1)}
          previousValue={data.previous?.velocity.toFixed(1)}
          delta={data.deltas.velocity}
          unit="tasks/day"
          isLoading={isLoading}
          hasError={!!error}
        />

        {/* Completion Rate Card */}
        <ComparisonMetricCard
          label="Completion Rate"
          currentValue={`${data.current.completionPercentage}%`}
          previousValue={
            data.previous ? `${data.previous.completionPercentage}%` : undefined
          }
          delta={data.deltas.completionRate}
          isLoading={isLoading}
          hasError={!!error}
        />

        {/* Tasks Completed Card */}
        <ComparisonMetricCard
          label="Tasks Completed"
          currentValue={Math.round(data.current.completedPoints / 3)}
          previousValue={
            data.previous
              ? Math.round(data.previous.completedPoints / 3)
              : undefined
          }
          delta={data.deltas.tasksCompleted}
          unit="tasks"
          isLoading={isLoading}
          hasError={!!error}
        />
      </div>

      {/* Comparison Chart */}
      <SprintComparisonChart
        current={data.current}
        previous={data.previous}
        isLoading={isLoading}
        hasError={!!error}
      />

      {/* Summary Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-slate-100">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div>
            <p className="font-medium text-slate-300 mb-1">Current Sprint Progress</p>
            <p>
              {data.current.completedPoints} / {data.current.totalPoints} points completed
              ({data.current.completionPercentage}%)
            </p>
          </div>
          {data.previous && (
            <div>
              <p className="font-medium text-slate-300 mb-1">Previous Sprint Progress</p>
              <p>
                {data.previous.completedPoints} / {data.previous.totalPoints} points completed
                ({data.previous.completionPercentage}%)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
