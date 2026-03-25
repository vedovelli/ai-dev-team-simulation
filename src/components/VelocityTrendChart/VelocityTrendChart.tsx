import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { SprintMetric } from '../../types/analytics'

interface VelocityTrendChartProps {
  data: SprintMetric[]
  isLoading?: boolean
  hasError?: boolean
}

/**
 * Velocity Trend Chart
 * Displays sprint velocity trends with grouped bars for planned vs completed points
 * and a line overlay for rolling average velocity
 */
export function VelocityTrendChart({
  data,
  isLoading = false,
  hasError = false,
}: VelocityTrendChartProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="h-8 bg-slate-700 rounded w-1/4 mb-6 animate-pulse" />
        <div className="w-full h-80 bg-slate-700 rounded animate-pulse" />
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
        <p className="font-semibold mb-2">Error loading velocity chart</p>
        <p className="text-sm">Unable to fetch sprint velocity data</p>
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Velocity Trend</h3>
        <div className="flex items-center justify-center h-80 text-slate-400">
          No velocity data available
        </div>
      </div>
    )
  }

  // Calculate rolling average (3-sprint average)
  const chartData = data.map((sprint, index) => {
    const startIdx = Math.max(0, index - 2)
    const window = data.slice(startIdx, index + 1)
    const avgVelocity = Math.round(
      window.reduce((sum, s) => sum + s.velocity, 0) / window.length
    )

    return {
      sprintName: sprint.sprintName,
      planned: sprint.totalTasks,
      completed: sprint.completedTasks,
      completionRate: sprint.completionRate,
      rollingAverage: avgVelocity,
    }
  })

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis
            dataKey="sprintName"
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
            label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toFixed(0)
              }
              return value
            }}
            labelFormatter={(label) => `${label}`}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
          />

          {/* Grouped bars: Planned and Completed */}
          <Bar
            dataKey="planned"
            fill="#60a5fa"
            name="Planned"
            barSize={30}
          />
          <Bar
            dataKey="completed"
            fill="#34d399"
            name="Completed"
            barSize={30}
          />

          {/* Rolling average line */}
          <Line
            type="monotone"
            dataKey="rollingAverage"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Rolling Average"
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
