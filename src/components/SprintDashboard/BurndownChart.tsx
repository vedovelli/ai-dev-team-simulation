import { MetricCardSkeleton } from '../Skeletons'

export interface BurndownDataPoint {
  day: number
  plannedTasks: number
  completedTasks: number
}

interface BurndownChartProps {
  data: BurndownDataPoint[]
  isLoading?: boolean
  hasError?: boolean
  onRetry?: () => void
}

export function BurndownChart({ data, isLoading = false, hasError = false, onRetry }: BurndownChartProps) {
  if (isLoading) {
    return <MetricCardSkeleton />
  }

  if (hasError) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
        <p className="font-semibold mb-3">Error loading burndown chart</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded transition-colors text-sm font-medium"
            aria-label="Retry loading burndown chart"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center text-slate-400">
        No burndown data available
      </div>
    )
  }

  const maxTasks = Math.max(...data.map((d) => Math.max(d.plannedTasks, d.completedTasks)))
  const chartHeight = 250

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">Sprint Burndown</h3>

      <div className="relative h-64 flex items-end justify-between gap-2 mb-4">
        {data.map((point, idx) => {
          const plannedHeight = (point.plannedTasks / maxTasks) * chartHeight
          const completedHeight = (point.completedTasks / maxTasks) * chartHeight

          return (
            <div key={`point-${idx}`} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-64 flex items-end justify-center">
                {/* Planned line background */}
                <div
                  className="absolute w-1 bg-slate-600/50"
                  style={{ height: `${plannedHeight}px` }}
                  title={`Day ${point.day}: Planned ${point.plannedTasks}`}
                ></div>

                {/* Completed bar */}
                <div
                  className="w-3/4 bg-blue-500 hover:bg-blue-400 transition-colors rounded-t"
                  style={{ height: `${completedHeight}px` }}
                  title={`Day ${point.day}: Completed ${point.completedTasks}`}
                ></div>
              </div>
              <div className="text-xs text-slate-400 font-medium">Day {point.day}</div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 text-sm text-slate-400 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-600/50"></div>
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  )
}
