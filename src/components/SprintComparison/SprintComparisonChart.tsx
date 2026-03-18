import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { SprintMetrics } from '../../types/sprint'

interface SprintComparisonChartProps {
  current: SprintMetrics
  previous: SprintMetrics | null
  isLoading?: boolean
  hasError?: boolean
}

/**
 * Sprint Comparison Chart component
 * Displays side-by-side bar chart comparing key metrics between current and previous sprint
 */
export function SprintComparisonChart({
  current,
  previous,
  isLoading = false,
  hasError = false,
}: SprintComparisonChartProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-96 animate-pulse flex items-center justify-center">
        <div className="text-slate-400">Loading chart...</div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
        <p className="font-semibold mb-2 text-red-200">Error loading chart</p>
        <p className="text-sm text-red-300">Unable to fetch comparison data</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = [
    {
      name: 'Velocity',
      current: current.velocity,
      previous: previous?.velocity || 0,
    },
    {
      name: 'Completion Rate',
      current: current.completionPercentage,
      previous: previous?.completionPercentage || 0,
    },
    {
      name: 'Tasks Completed',
      current: current.completedPoints / 3, // Convert points back to tasks for readability
      previous: previous ? previous.completedPoints / 3 : 0,
    },
  ]

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">Metrics Comparison</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value) => (typeof value === 'number' ? value.toFixed(1) : value)}
          />
          <Legend />
          <Bar
            dataKey="current"
            fill="#3b82f6"
            name="Current Sprint"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="previous"
            fill="#64748b"
            name="Previous Sprint"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Current Sprint Status</p>
            <p className={`text-sm font-medium ${current.onTrack ? 'text-green-300' : 'text-yellow-300'}`}>
              {current.onTrack ? '✓ On Track' : '⚠ At Risk'}
            </p>
          </div>
          {previous && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Previous Sprint Status</p>
              <p className={`text-sm font-medium ${previous.onTrack ? 'text-green-300' : 'text-yellow-300'}`}>
                {previous.onTrack ? '✓ On Track' : '⚠ At Risk'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
