import type { DeltaMetric } from '../../types/sprint-comparison'

interface DeltaBadgeProps {
  delta: DeltaMetric
  showPercentage?: boolean
}

/**
 * Delta Badge component - displays trend with color coding
 * Green for improvement, red for regression, grey for neutral
 */
export function DeltaBadge({ delta, showPercentage = true }: DeltaBadgeProps) {
  const getColor = () => {
    if (delta.trend === 'up') return 'bg-green-900/50 text-green-300'
    if (delta.trend === 'down') return 'bg-red-900/50 text-red-300'
    return 'bg-slate-700/50 text-slate-300'
  }

  const getIcon = () => {
    if (delta.trend === 'up') return '↑'
    if (delta.trend === 'down') return '↓'
    return '→'
  }

  const displayValue = showPercentage
    ? `${delta.value > 0 ? '+' : ''}${delta.value}${Math.abs(delta.percentage) > 0 ? ` (${delta.percentage > 0 ? '+' : ''}${delta.percentage}%)` : ''}`
    : `${delta.value > 0 ? '+' : ''}${delta.value}`

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getColor()}`}>
      <span>{getIcon()}</span>
      <span>{displayValue}</span>
    </span>
  )
}
