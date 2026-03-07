import type { TaskStatus, TaskPriority } from '../types/sprint'

interface Task {
  id: string
  title: string
  assignee: string
  priority: TaskPriority
}

interface TaskStatusListProps {
  status: TaskStatus
  tasks: Task[]
}

const statusConfig = {
  backlog: { label: 'Backlog', color: 'bg-slate-700', textColor: 'text-slate-300' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-700', textColor: 'text-blue-300' },
  'in-review': { label: 'In Review', color: 'bg-purple-700', textColor: 'text-purple-300' },
  done: { label: 'Done', color: 'bg-green-700', textColor: 'text-green-300' },
}

const priorityConfig = {
  low: 'text-slate-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
}

/**
 * Component to display tasks grouped by status.
 */
export function TaskStatusList({ status, tasks }: TaskStatusListProps) {
  const config = statusConfig[status]

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.textColor}`}>
          {config.label}
        </div>
        <span className="text-slate-400 text-sm">({tasks.length})</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500 text-sm">No tasks</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-slate-700 rounded p-3 hover:bg-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-white flex-1 break-words">{task.title}</p>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${priorityConfig[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400">Assigned to: {task.assignee}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
