import type React from 'react'

export interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  hasError?: boolean
}

/**
 * Metric Card component for displaying key sprint metrics
 * Shows value with optional trend indicator and color coding
 */
export function MetricCard({
  label,
  value,
  unit,
  trend,
  icon,
  color = 'blue',
  size = 'md',
  isLoading,
  hasError,
}: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-900/30 border-blue-700',
    green: 'bg-green-900/30 border-green-700',
    yellow: 'bg-yellow-900/30 border-yellow-700',
    red: 'bg-red-900/30 border-red-700',
    purple: 'bg-purple-900/30 border-purple-700',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const valueSize: Record<string, string> = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-bold',
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg border border-slate-700 ${colorClasses[color]} ${sizeClasses[size]} animate-pulse`}>
        <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-8 bg-slate-700 rounded w-3/4" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={`rounded-lg border border-red-700 bg-red-900/30 ${sizeClasses[size]}`}>
        <p className="text-sm text-red-300 mb-1">{label}</p>
        <p className="text-red-400 text-sm">Error loading metric</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border ${colorClasses[color]} ${sizeClasses[size]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-slate-400">{label}</p>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              trend === 'up'
                ? 'bg-green-900/50 text-green-300'
                : trend === 'down'
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={valueSize[size]}>{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {icon && <div className="mt-3 text-slate-400">{icon}</div>}
    </div>
  )
}
