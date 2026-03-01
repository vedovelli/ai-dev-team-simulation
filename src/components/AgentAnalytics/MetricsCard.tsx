interface MetricsCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricsCard({ label, value, subtext, trend }: MetricsCardProps) {
  const trendColor = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && <span className={`text-sm ${trendColor[trend]}`}>●</span>}
      </div>
      {subtext && <p className="text-slate-500 text-xs mt-2">{subtext}</p>}
    </div>
  )
}
