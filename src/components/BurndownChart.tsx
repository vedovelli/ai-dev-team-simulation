import type { BurndownDataPoint } from '../types/sprint'

interface BurndownChartProps {
  data: BurndownDataPoint[]
  totalPoints: number
}

export function BurndownChart({ data, totalPoints }: BurndownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-slate-400">No burndown data available</p>
      </div>
    )
  }

  const padding = 60
  const chartWidth = 600
  const chartHeight = 300
  const svgWidth = chartWidth + padding * 2
  const svgHeight = chartHeight + padding * 2

  const maxDay = data.length - 1
  const xScale = chartWidth / maxDay || 1
  const yScale = chartHeight / totalPoints || 1

  // Convert data to SVG coordinates
  const getX = (day: number) => padding + day * xScale
  const getY = (points: number) => padding + chartHeight - points * yScale

  // Build ideal line path
  const idealPath = data.map((point) => `${getX(point.day)},${getY(point.ideal)}`).join(' L ')

  // Build actual line path
  const actualPath = data.map((point) => `${getX(point.day)},${getY(point.actual)}`).join(' L ')

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Sprint Burndown</h3>
      <svg
        width={svgWidth}
        height={svgHeight}
        className="w-full h-auto border border-slate-700 rounded bg-slate-900"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (chartHeight / 4) * i
          return (
            <line
              key={`grid-h-${i}`}
              x1={padding}
              y1={y}
              x2={padding + chartWidth}
              y2={y}
              stroke="#475569"
              strokeDasharray="4,4"
              strokeWidth="1"
            />
          )
        })}

        {Array.from({ length: Math.min(5, maxDay) }).map((_, i) => {
          const x = padding + (chartWidth / Math.min(4, maxDay)) * i
          return (
            <line
              key={`grid-v-${i}`}
              x1={x}
              y1={padding}
              x2={x}
              y2={padding + chartHeight}
              stroke="#475569"
              strokeDasharray="4,4"
              strokeWidth="1"
            />
          )
        })}

        {/* Axes */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartHeight}
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding + chartHeight}
          x2={padding + chartWidth}
          y2={padding + chartHeight}
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        {/* Y-axis labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const value = totalPoints - (totalPoints / 4) * i
          const y = padding + (chartHeight / 4) * i
          return (
            <text
              key={`y-label-${i}`}
              x={padding - 10}
              y={y + 5}
              textAnchor="end"
              fontSize="12"
              fill="#94a3b8"
            >
              {Math.round(value)}
            </text>
          )
        })}

        {/* X-axis labels */}
        {Array.from({ length: Math.min(5, maxDay + 1) }).map((_, i) => {
          const day = Math.floor((maxDay / 4) * i)
          const x = getX(day)
          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={padding + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#94a3b8"
            >
              Day {day}
            </text>
          )
        })}

        {/* Y-axis title */}
        <text
          x={20}
          y={padding + chartHeight / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#cbd5e1"
          transform={`rotate(-90 20 ${padding + chartHeight / 2})`}
        >
          Story Points
        </text>

        {/* X-axis title */}
        <text
          x={padding + chartWidth / 2}
          y={svgHeight - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#cbd5e1"
        >
          Days
        </text>

        {/* Ideal line */}
        <polyline
          points={idealPath}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="6,4"
        />

        {/* Actual line */}
        <polyline
          points={actualPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
        />

        {/* Data points */}
        {data.map((point) => (
          <circle
            key={`point-${point.day}`}
            cx={getX(point.day)}
            cy={getY(point.actual)}
            r="3"
            fill="#3b82f6"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-blue-500" />
          <span className="text-sm text-slate-300">Actual Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-slate-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 6px, transparent 6px, transparent 10px)' }} />
          <span className="text-sm text-slate-300">Ideal Progress</span>
        </div>
      </div>
    </div>
  )
}
