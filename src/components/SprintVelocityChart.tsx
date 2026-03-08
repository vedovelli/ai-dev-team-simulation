import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { SprintMetric } from '../types/analytics'

interface SprintVelocityChartProps {
  sprints: SprintMetric[]
  title?: string
  height?: number
}

/**
 * Sprint Velocity Chart
 * Displays sprint performance metrics including completion rates and velocity
 * Shows burndown trends across multiple sprints
 */
export function SprintVelocityChart({
  sprints,
  title = 'Sprint Velocity & Completion',
  height = 350,
}: SprintVelocityChartProps) {
  if (!sprints || sprints.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-80 text-slate-400">
          No sprint data available
        </div>
      </div>
    )
  }

  // Transform sprint data for charting
  const chartData = sprints.map((sprint) => ({
    sprintName: sprint.sprintName,
    velocity: sprint.velocity,
    completionRate: sprint.completionRate,
    completedTasks: sprint.completedTasks,
    totalTasks: sprint.totalTasks,
  }))

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="sprintName" stroke="#94a3b8" />
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
          <Area
            type="monotone"
            dataKey="completionRate"
            fill="#34d399"
            stroke="#10b981"
            name="Completion Rate (%)"
            dot={true}
          />
          <Area
            type="monotone"
            dataKey="velocity"
            fill="#60a5fa"
            stroke="#3b82f6"
            name="Velocity (tasks)"
            dot={true}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Sprint Statistics Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 font-semibold text-slate-300">Sprint</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-300">Tasks</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-300">Completion</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-300">Velocity</th>
            </tr>
          </thead>
          <tbody>
            {sprints.map((sprint) => (
              <tr key={sprint.sprintId} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="py-2 px-3 text-slate-300">{sprint.sprintName}</td>
                <td className="text-right py-2 px-3 text-slate-300">
                  {sprint.completedTasks}/{sprint.totalTasks}
                </td>
                <td className="text-right py-2 px-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      sprint.completionRate >= 80
                        ? 'bg-green-900 text-green-300'
                        : sprint.completionRate >= 50
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {sprint.completionRate}%
                  </span>
                </td>
                <td className="text-right py-2 px-3 text-slate-300">{sprint.velocity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
