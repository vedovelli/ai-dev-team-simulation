import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TimeSeriesDataPoint } from '../types/analytics'

interface AgentUtilizationChartProps {
  data: TimeSeriesDataPoint[]
  title?: string
  height?: number
}

/**
 * Agent Utilization Chart
 * Displays time-series data of agent completion rates over time
 * Uses Recharts to visualize multiple agents' performance trends
 */
export function AgentUtilizationChart({
  data,
  title = 'Agent Utilization Over Time',
  height = 350,
}: AgentUtilizationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-80 text-slate-400">
          No utilization data available
        </div>
      </div>
    )
  }

  // Transform flat time-series data into grouped by date
  const groupedData = data.reduce(
    (acc, point) => {
      const date = new Date(point.timestamp).toLocaleDateString()
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing[point.metric] = point.value
      } else {
        acc.push({ date, [point.metric]: point.value })
      }
      return acc
    },
    [] as Array<{ date: string; [key: string]: string | number }>,
  )

  // Get unique metrics/agents
  const metrics = Array.from(new Set(data.map((d) => d.metric)))
  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={groupedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Legend />
          {metrics.map((metric, index) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={colors[index % colors.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
