interface StatsCardProps {
  label: string
  value: string | number
  unit?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variantStyles = {
  default: 'text-white',
  success: 'text-green-400',
  warning: 'text-orange-400',
  danger: 'text-red-400',
  info: 'text-blue-400',
}

/**
 * Reusable stats card component for displaying key metrics.
 */
export function StatsCard({ label, value, unit, variant = 'default' }: StatsCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-3xl font-bold ${variantStyles[variant]}`}>{value}</p>
        {unit && <p className="text-sm text-slate-500">{unit}</p>}
      </div>
    </div>
  )
}
