import React from 'react'

export interface WorkloadIndicatorProps {
  currentTasks: number
  maxTasks: number
  agentName: string
}

/**
 * Visual indicator for agent workload status.
 * Shows task count and progress with color-coded feedback.
 */
export function WorkloadIndicator({
  currentTasks,
  maxTasks,
  agentName,
}: WorkloadIndicatorProps) {
  const percentage = (currentTasks / maxTasks) * 100
  const isOverloaded = currentTasks > maxTasks
  const isWarning = currentTasks >= maxTasks * 0.75

  const getColor = () => {
    if (isOverloaded) return 'bg-red-600'
    if (isWarning) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  const getStatusText = () => {
    if (isOverloaded) return 'Overloaded'
    if (isWarning) return 'Near Capacity'
    return 'Available'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{agentName}</span>
        <span className={`font-semibold ${isOverloaded ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'}`}>
          {getStatusText()}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${getColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">
        {currentTasks} / {maxTasks} tasks
      </div>
    </div>
  )
}
