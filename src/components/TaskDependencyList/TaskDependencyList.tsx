import type { Task, TaskStatus } from '../../types/task'
import { useTaskDependencies } from '../../hooks/useTaskDependencies'
import { BlockingStatusBadge } from '../BlockingStatusBadge/BlockingStatusBadge'

interface TaskDependencyListProps {
  taskId: string
}

const statusColors: Record<TaskStatus, string> = {
  backlog: 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'in-review': 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-200',
    'bg-orange-200',
    'bg-yellow-200',
    'bg-green-200',
    'bg-blue-200',
    'bg-indigo-200',
    'bg-purple-200',
    'bg-pink-200',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

/**
 * Displays a task's dependencies and blockers in two sections:
 * - "Blocked by" (dependencies) - tasks that must complete before this task
 * - "Blocking" (blockers) - tasks waiting on this task
 *
 * Each entry shows task title, status badge, and assignee avatar.
 * Blocked tasks show a lock icon on the CTA.
 */
export function TaskDependencyList({ taskId }: TaskDependencyListProps) {
  const { data, isLoading } = useTaskDependencies(taskId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  const dependencies = data?.dependencies || []
  const blockers = data?.blockers || []

  return (
    <div className="space-y-6">
      {/* Blocked By Section */}
      {dependencies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            🔒 Blocked by {dependencies.length} task{dependencies.length !== 1 ? 's' : ''}
          </h3>
          <ul className="space-y-2" role="list" aria-label="Tasks blocking this task">
            {dependencies.map((depTask) => (
              <li
                key={depTask.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">{depTask.title}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[depTask.status]}`}>
                      {depTask.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{depTask.id}</p>
                </div>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(depTask.assignee)}`}
                  title={depTask.assignee}
                  aria-label={`Assigned to ${depTask.assignee}`}
                >
                  {getInitials(depTask.assignee)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blocking Section */}
      {blockers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            ⚠️ Blocking {blockers.length} task{blockers.length !== 1 ? 's' : ''}
          </h3>
          <ul className="space-y-2" role="list" aria-label="Tasks waiting on this task">
            {blockers.map((blockerTask) => (
              <li
                key={blockerTask.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate line-through decoration-amber-600">
                      {blockerTask.title}
                    </p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[blockerTask.status]}`}>
                      {blockerTask.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{blockerTask.id}</p>
                </div>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(blockerTask.assignee)}`}
                  title={blockerTask.assignee}
                  aria-label={`Assigned to ${blockerTask.assignee}`}
                >
                  {getInitials(blockerTask.assignee)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {dependencies.length === 0 && blockers.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">No dependencies or blockers for this task</p>
      )}
    </div>
  )
}
