import React, { useMemo } from 'react'
import type { TimeSeriesDataPoint } from '../../types/metrics'

interface SimpleChartProps {
  data: TimeSeriesDataPoint[]
  title: string
  yAxisLabel?: string
}

export function SimpleChart({ data, title, yAxisLabel = 'Value' }: SimpleChartProps) {
  const chartDimensions = useMemo(
    () => ({
      width: 600,
      height: 300,
      padding: { top: 20, right: 20, bottom: 40, left: 60 },
    }),
    []
  )

  const { scale, points, maxValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { scale: 1, points: [], maxValue: 0 }
    }

    const maxVal = Math.max(...data.map((p) => p.value))
    const minVal = Math.min(...data.map((p) => p.value))
    const range = maxVal - minVal || 1

    const innerWidth = chartDimensions.width - chartDimensions.padding.left - chartDimensions.padding.right
    const innerHeight =
      chartDimensions.height - chartDimensions.padding.top - chartDimensions.padding.bottom

    const xScale = innerWidth / (data.length - 1 || 1)
    const yScale = innerHeight / range

    const points = data.map((point, index) => ({
      x: chartDimensions.padding.left + index * xScale,
      y: chartDimensions.padding.top + innerHeight - (point.value - minVal) * yScale,
      value: point.value,
      timestamp: point.timestamp,
    }))

    return { scale: yScale, points, maxValue: maxVal }
  }, [data, chartDimensions])

  const pathD = useMemo(() => {
    if (points.length < 2) return ''

    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`
    }
    return d
  }, [points])

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>

      <div className="relative">
        <svg
          width={chartDimensions.width}
          height={chartDimensions.height}
          className="w-full border border-slate-700 rounded bg-slate-900/20"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Y-axis */}
          <line
            x1={chartDimensions.padding.left}
            y1={chartDimensions.padding.top}
            x2={chartDimensions.padding.left}
            y2={chartDimensions.height - chartDimensions.padding.bottom}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* X-axis */}
          <line
            x1={chartDimensions.padding.left}
            y1={chartDimensions.height - chartDimensions.padding.bottom}
            x2={chartDimensions.width - chartDimensions.padding.right}
            y2={chartDimensions.height - chartDimensions.padding.bottom}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const innerHeight =
              chartDimensions.height - chartDimensions.padding.top - chartDimensions.padding.bottom
            const y = chartDimensions.padding.top + innerHeight - innerHeight * ratio
            const value = Math.round(maxValue * ratio)

            return (
              <g key={`y-${ratio}`}>
                <text
                  x={chartDimensions.padding.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs fill-slate-500"
                >
                  {value}
                </text>
                <line
                  x1={chartDimensions.padding.left}
                  y1={y}
                  x2={chartDimensions.width - chartDimensions.padding.right}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="0.5"
                  strokeDasharray="4"
                />
              </g>
            )
          })}

          {/* Line path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Data points and hover interaction */}
          {points.map((point, index) => (
            <g key={`point-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === index ? 6 : 3}
                fill={hoveredIndex === index ? '#ef4444' : '#3b82f6'}
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
              />

              {/* Tooltip on hover */}
              {hoveredIndex === index && (
                <g>
                  <rect
                    x={point.x - 40}
                    y={point.y - 40}
                    width="80"
                    height="30"
                    fill="#1e293b"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={point.x}
                    y={point.y - 25}
                    textAnchor="middle"
                    className="text-xs fill-slate-100 font-semibold"
                  >
                    {point.value}
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 12}
                    textAnchor="middle"
                    className="text-xs fill-slate-400"
                  >
                    {new Date(point.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Metric Value</span>
        </div>
        <div>
          <span className="text-slate-500">Y-axis: {yAxisLabel}</span>
        </div>
      </div>
    </div>
  )
}
