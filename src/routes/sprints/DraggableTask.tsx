import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/task'

interface DraggableTaskProps {
  task: Task
  isLoading?: boolean
}

export function DraggableTask({ task, isLoading = false }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  })

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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <p className="text-xs text-gray-600">{task.assignee}</p>
        </div>
        {isLoading && (
          <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {task.storyPoints} pts
        </span>
      </div>
    </div>
  )
}
