import type { SearchTask } from '../../types/task-search'

interface TaskSearchResultCardProps {
  task: SearchTask
  onSelect?: (taskId: string) => void
}

export function TaskSearchResultCard({ task, onSelect }: TaskSearchResultCardProps) {
  const priorityColors: Record<string, string> = {
    low: 'bg-blue-900/30 text-blue-300 border-blue-700',
    medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
    high: 'bg-red-900/30 text-red-300 border-red-700',
  }

  const statusColors: Record<string, string> = {
    backlog: 'bg-slate-700 text-slate-300',
    'in-progress': 'bg-blue-700 text-blue-300',
    'in-review': 'bg-purple-700 text-purple-300',
    done: 'bg-green-700 text-green-300',
  }

  return (
    <button
      onClick={() => onSelect?.(task.id)}
      className="w-full text-left p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-colors group"
    >
      {/* Title */}
      <h3 className="font-medium text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
        {task.title}
      </h3>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Priority Badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority] || priorityColors.medium}`}>
          {task.priority}
        </span>

        {/* Status Badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status] || statusColors.backlog}`}>
          {task.status.replace('-', ' ')}
        </span>
      </div>

      {/* Assignee and Sprint */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {/* Assignee Avatar */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
            {task.assignee.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{task.assignee}</span>
        </div>
        <span className="truncate ml-2">{task.sprint}</span>
      </div>

      {/* Matched Fields Info */}
      {task.matchedFields.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          Matched in: {task.matchedFields.join(', ')}
        </p>
      )}
    </button>
  )
}
