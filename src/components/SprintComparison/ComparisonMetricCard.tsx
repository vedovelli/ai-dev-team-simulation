import type { SprintMetrics } from '../../types/sprint'
import type { DeltaMetric } from '../../types/sprint-comparison'
import { DeltaBadge } from './DeltaBadge'

interface ComparisonMetricCardProps {
  label: string
  currentValue: number | string
  previousValue?: number | string
  delta?: DeltaMetric
  unit?: string
  isLoading?: boolean
  hasError?: boolean
}

/**
 * Comparison Metric Card component
 * Displays current metric, previous metric (if available), and delta with trend
 */
export function ComparisonMetricCard({
  label,
  currentValue,
  previousValue,
  delta,
  unit,
  isLoading,
  hasError,
}: ComparisonMetricCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-700 rounded w-3/4 mb-3" />
        <div className="h-4 bg-slate-700 rounded w-1/2" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/30 p-4">
        <p className="text-sm text-red-300 mb-1">{label}</p>
        <p className="text-red-400 text-sm">Error loading metric</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <p className="text-sm text-slate-400 mb-2">{label}</p>

      <div className="mb-3">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold text-blue-300">{currentValue}</span>
          {unit && <span className="text-sm text-slate-400">{unit}</span>}
        </div>
        <p className="text-xs text-slate-500">Current Sprint</p>
      </div>

      {previousValue !== undefined && (
        <div className="mb-3 pt-3 border-t border-slate-700">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-semibold text-slate-400">{previousValue}</span>
            {unit && <span className="text-xs text-slate-500">{unit}</span>}
          </div>
          <p className="text-xs text-slate-500">Previous Sprint</p>
        </div>
      )}

      {delta && (
        <div className="pt-3 border-t border-slate-700">
          <DeltaBadge delta={delta} />
        </div>
      )}
    </div>
  )
}
