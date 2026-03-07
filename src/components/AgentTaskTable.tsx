import { useNavigate } from '@tanstack/react-router'
import type { Task } from '../types/task'

interface AgentTaskTableProps {
  data: Task[]
  isLoading?: boolean
  onStatusChange?: (taskId: string, newStatus: string) => void
  sortKey?: keyof Task | null
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: keyof Task) => void
}

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  backlog: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-800' },
  'in-progress': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-200 text-blue-800',
  },
  'in-review': { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-200 text-purple-800' },
  done: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-200 text-green-800' },
}

const priorityColors: Record<string, string> = {
  low: 'text-gray-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
}

/**
 * Task table component for displaying agent task list.
 * Shows task details with status, priority, and assignee information.
 * Supports sorting and status updates via dropdown.
 */
export function AgentTaskTable({
  data,
  isLoading = false,
  onStatusChange,
  sortKey,
  sortOrder,
  onSort,
}: AgentTaskTableProps) {
  const navigate = useNavigate()

  const handleRowClick = (taskId: string) => {
    navigate({ to: '/tasks/$id', params: { id: taskId } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No tasks found</p>
      </div>
    )
  }

  const handleSort = (key: keyof Task) => {
    onSort?.(key)
  }

  const SortIndicator = ({
    columnKey,
    label,
  }: {
    columnKey: keyof Task
    label: string
  }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {label}
      {sortKey === columnKey && (
        <span className="text-xs">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortIndicator columnKey="title" label="Task" />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortIndicator columnKey="status" label="Status" />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortIndicator columnKey="priority" label="Priority" />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortIndicator columnKey="assignee" label="Assignee" />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortIndicator columnKey="storyPoints" label="Points" />
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              <SortIndicator columnKey="deadline" label="Deadline" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((task) => {
            const statusColor = statusColors[task.status] || statusColors.backlog
            const priorityColor = priorityColors[task.priority] || 'text-gray-600'

            return (
              <tr
                key={task.id}
                onClick={() => handleRowClick(task.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{task.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2"
                  >
                    <select
                      value={task.status}
                      onChange={(e) => {
                        onStatusChange?.(task.id, e.target.value)
                      }}
                      className={`text-xs px-2 py-1 rounded font-medium ${statusColor.badge} border border-current focus:outline-none cursor-pointer`}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in-progress">In Progress</option>
                      <option value="in-review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold ${priorityColor} capitalize`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {task.assignee || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {task.storyPoints}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString()
                      : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
