import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskPriority } from '../types/task'

interface TaskCardProps {
  task: Task
  isLoading?: boolean
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
}

const priorityBgColors: Record<TaskPriority, string> = {
  low: 'bg-green-50',
  medium: 'bg-yellow-50',
  high: 'bg-red-50',
}

export function TaskCard({ task, isLoading = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 ${
        isDragging ? 'shadow-lg cursor-grabbing' : 'shadow-sm hover:shadow-md cursor-grab'
      } ${isLoading ? 'opacity-60 pointer-events-none' : ''} active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
          <p className="text-xs text-gray-600">{task.assignee}</p>
        </div>
        {isLoading && (
          <div className="ml-2 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${priorityBgColors[task.priority]} ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {task.storyPoints} pts
        </span>
      </div>
    </div>
  )
}
