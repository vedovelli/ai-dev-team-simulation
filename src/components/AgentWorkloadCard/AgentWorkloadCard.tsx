import { type ReactNode } from 'react'
import type { WorkloadAnalytics } from '../../hooks/useWorkloadAnalytics'

interface AgentWorkloadCardProps {
  workload: WorkloadAnalytics
  onDragStart: (e: React.DragEvent<HTMLDivElement>, agentId: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, agentId: string) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  children?: ReactNode
}

/**
 * Displays agent workload information with capacity bar and task badges
 * Supports drag-and-drop for task reassignment
 */
export function AgentWorkloadCard({
  workload,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  children,
}: AgentWorkloadCardProps) {
  const getCapacityColor = (utilization: number) => {
    if (utilization >= 80) return 'bg-red-500'
    if (utilization >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50'
      case 'busy':
        return 'bg-yellow-50'
      case 'overloaded':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800'
      case 'overloaded':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, workload.agentId)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, workload.agentId)}
      className={`rounded-lg border border-gray-200 p-4 transition ${getStatusBgColor(workload.status)} cursor-move hover:shadow-md`}
    >
      {/* Header: Agent name and status badge */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{workload.name}</h3>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeColor(workload.status)}`}
        >
          {workload.status}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-sm">
          <span className="font-medium text-gray-700">Capacity</span>
          <span className="text-gray-600">{Math.round(workload.capacityUtilization)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all ${getCapacityColor(workload.capacityUtilization)}`}
            style={{ width: `${workload.capacityUtilization}%` }}
          />
        </div>
      </div>

      {/* Task count badges */}
      <div className="mb-3 flex gap-2">
        <div className="flex flex-col rounded bg-blue-100 px-2 py-1">
          <span className="text-xs font-semibold text-blue-900">{workload.activeTasksCount}</span>
          <span className="text-xs text-blue-700">Active</span>
        </div>
        <div className="flex flex-col rounded bg-purple-100 px-2 py-1">
          <span className="text-xs font-semibold text-purple-900">{workload.completedTasks}</span>
          <span className="text-xs text-purple-700">Completed</span>
        </div>
        <div className="flex flex-col rounded bg-orange-100 px-2 py-1">
          <span className="text-xs font-semibold text-orange-900">
            {Math.round(workload.averageCompletionTime)}h
          </span>
          <span className="text-xs text-orange-700">Avg Time</span>
        </div>
      </div>

      {/* Completion trend */}
      <div className="mb-3 text-sm">
        <span className="text-gray-600">7-day trend: </span>
        <span
          className={`font-semibold ${workload.completionTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {workload.completionTrend >= 0 ? '+' : ''}
          {workload.completionTrend.toFixed(1)}%
        </span>
      </div>

      {/* Skill tags */}
      {workload.skillTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {workload.skillTags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Drag-and-drop zone for tasks */}
      {children && <div className="mt-3 border-t border-gray-200 pt-3">{children}</div>}
    </div>
  )
}
