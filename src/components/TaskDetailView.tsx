import { useState } from 'react'
import type { Task } from '../types/task'

interface TaskDetailViewProps {
  task: Task | undefined
  isLoading?: boolean
  isUpdating?: boolean
  onStatusChange?: (newStatus: string) => void
}

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  backlog: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-800' },
  'in-progress': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-200 text-blue-800',
  },
  'in-review': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    badge: 'bg-purple-200 text-purple-800',
  },
  done: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-200 text-green-800' },
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-800' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  high: { bg: 'bg-red-100', text: 'text-red-800' },
}

/**
 * Task detail view component for displaying full task information.
 * Shows description, status, priority, assignee, and action buttons.
 */
export function TaskDetailView({
  task,
  isLoading = false,
  isUpdating = false,
  onStatusChange,
}: TaskDetailViewProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Task not found</p>
      </div>
    )
  }

  const statusColor = statusColors[task.status] || statusColors.backlog
  const priorityColor = priorityColors[task.priority] || priorityColors.low

  const handleStatusChange = (newStatus: string) => {
    onStatusChange?.(newStatus)
    setShowStatusDropdown(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-sm text-gray-500 mt-2">Task ID: {task.id}</p>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={isUpdating}
              className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor.badge} ${
                isUpdating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {task.status}
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {['backlog', 'in-progress', 'in-review', 'done'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${priorityColor.bg} ${priorityColor.text} capitalize`}
          >
            {task.priority} priority
          </span>

          {task.deadline && (
            <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
              Due: {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assignee */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Assignee</p>
          <p className="text-lg font-semibold text-gray-900">
            {task.assignee || 'Unassigned'}
          </p>
        </div>

        {/* Team */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Team</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">
            {task.team}
          </p>
        </div>

        {/* Story Points */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Story Points</p>
          <p className="text-lg font-semibold text-gray-900">
            {task.storyPoints}
          </p>
        </div>

        {/* Sprint */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Sprint</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">
            {task.sprint}
          </p>
        </div>

        {/* Estimated Hours */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Est. Hours</p>
          <p className="text-lg font-semibold text-gray-900">
            {task.estimatedHours ? `${task.estimatedHours}h` : '—'}
          </p>
        </div>

        {/* Updated At */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(task.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600 font-medium">Created</p>
            <p className="text-gray-900 mt-1">
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Order</p>
            <p className="text-gray-900 mt-1">{task.order}</p>
          </div>
          {task.dependsOn && task.dependsOn.length > 0 && (
            <div>
              <p className="text-gray-600 font-medium">Dependencies</p>
              <p className="text-gray-900 mt-1">{task.dependsOn.length} tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
