import { useSprintVelocityData } from '../../hooks/useSprintVelocityData'
import { VelocityTrendChart } from './VelocityTrendChart'

interface SprintVelocityPanelProps {
  /** Optional CSS class for layout flexibility */
  className?: string
  /** Time range for velocity data (default: '30d') */
  timeRange?: '7d' | '30d' | '90d' | 'all'
}

/**
 * Sprint Velocity Panel
 * Wrapper component that fetches sprint velocity data and displays it in a card layout
 * with rolling average subtitle
 */
export function SprintVelocityPanel({
  className = '',
  timeRange = '30d',
}: SprintVelocityPanelProps) {
  const { data, isLoading, error } = useSprintVelocityData({
    timeRange,
  })

  // Calculate rolling average for subtitle
  const getRollingAverage = () => {
    if (!data || data.length === 0) return 0
    const window = data.slice(-3)
    return Math.round(
      window.reduce((sum, sprint) => sum + sprint.velocity, 0) / window.length
    )
  }

  const rollingAvg = getRollingAverage()

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border border-slate-700 ${className}`}>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Velocity Trend</h2>
        <p className="text-sm text-slate-400">
          3-sprint avg: {rollingAvg} pts
        </p>
      </div>

      {/* Chart */}
      <VelocityTrendChart
        data={data || []}
        isLoading={isLoading}
        hasError={!!error}
      />
    </div>
  )
}
