import type { ReactNode } from 'react'

export interface AgentMetrics {
  completionRate: number
  averageTimeToComplete: number
  errorCount: number
}

interface AgentMetricsCardProps {
  agentName: string
  metrics: AgentMetrics
  isLoading?: boolean
  error?: string | null
}

function getCompletionRateColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500'
  if (rate >= 60) return 'bg-blue-500'
  if (rate >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getCompletionRateBgColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-50'
  if (rate >= 60) return 'bg-blue-50'
  if (rate >= 40) return 'bg-amber-50'
  return 'bg-red-50'
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}h ${mins}m`
}

interface MetricBadgeProps {
  label: string
  value: ReactNode
  color: 'emerald' | 'red' | 'slate'
}

function MetricBadge({ label, value, color }: MetricBadgeProps): JSX.Element {
  const bgMap: Record<MetricBadgeProps['color'], string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </p>
      <div className={`px-3 py-1.5 rounded-lg font-bold ${bgMap[color]}`}>
        {value}
      </div>
    </div>
  )
}

function SkeletonLoader(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-slate-200 rounded-lg animate-pulse" />
      <div className="space-y-3">
        <div className="h-6 bg-slate-200 rounded animate-pulse" />
        <div className="h-6 bg-slate-200 rounded animate-pulse w-3/4" />
        <div className="h-6 bg-slate-200 rounded animate-pulse w-4/5" />
      </div>
    </div>
  )
}

export function AgentMetricsCard({
  agentName,
  metrics,
  isLoading = false,
  error = null,
}: AgentMetricsCardProps) {
  if (isLoading) {
    return (
      <article className="p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm bg-white">
        <SkeletonLoader />
      </article>
    )
  }

  if (error) {
    return (
      <article className="p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm bg-red-50">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠</span>
          <div>
            <h3 className="font-bold text-red-900">{agentName}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </article>
    )
  }

  const completionRate = Math.max(0, Math.min(100, metrics.completionRate))

  return (
    <article
      className={`p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm ${getCompletionRateBgColor(completionRate)} transition-colors duration-200`}
    >
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">{agentName}</h3>
      </div>

      {/* Completion Rate Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Completion Rate
          </p>
          <span className="text-sm font-bold text-slate-700">
            {Math.round(completionRate)}%
          </span>
        </div>
        <div
          className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${agentName} completion rate`}
        >
          <div
            className={`h-full ${getCompletionRateColor(completionRate)} transition-all duration-300`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricBadge
          label="Avg Time"
          value={formatDuration(metrics.averageTimeToComplete)}
          color="slate"
        />
        <MetricBadge
          label="Errors"
          value={metrics.errorCount}
          color={metrics.errorCount > 0 ? 'red' : 'emerald'}
        />
        <MetricBadge
          label="Status"
          value={completionRate >= 80 ? '✓ Good' : '⟳ Fair'}
          color={completionRate >= 80 ? 'emerald' : 'slate'}
        />
      </div>
    </article>
  )
}
