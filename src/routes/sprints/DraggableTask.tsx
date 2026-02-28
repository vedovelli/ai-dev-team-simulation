import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/task'

interface DraggableTaskProps {
  task: Task
}

export function DraggableTask({ task }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow ${
        isDragging ? 'shadow-lg' : 'hover:shadow-md'
      } active:cursor-grabbing`}
    >
      <h3 className="font-medium text-gray-900">{task.title}</h3>
      <p className="text-xs text-gray-600">{task.assignee}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          {task.storyPoints} pts
        </span>
      </div>
    </div>
  )
}
