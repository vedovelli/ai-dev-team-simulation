import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskDetailModal } from '../../components/TaskDetailModal'
import { useUpdateTaskDependencies } from '../../hooks/useUpdateTaskDependencies'
import { useToast } from '../../components/Toast'
import type { Task } from '../../types/task'

interface DraggableTaskProps {
  task: Task
  isLoading?: boolean
  allTasks?: Task[]
}

export function DraggableTask({ task, isLoading = false, allTasks = [] }: DraggableTaskProps) {
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const updateDependencies = useUpdateTaskDependencies()
  const { showToast } = useToast()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleTaskDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleModalSave = (updatedTask: Task) => {
    updateDependencies.mutate(
      {
        id: updatedTask.id,
        dependsOn: updatedTask.dependsOn || [],
      },
      {
        onSuccess: () => {
          showToast('Task dependencies updated', 'success')
          setIsModalOpen(false)
        },
        onError: (error) => {
          showToast(error.message || 'Failed to update dependencies', 'error')
        },
      }
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={handleTaskDetailClick}
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
          {task.dependsOn && task.dependsOn.length > 0 && (
            <span className="text-xs text-gray-600">
              {task.dependsOn.length} dep{task.dependsOn.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <TaskDetailModal
        task={task}
        allTasks={allTasks}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        isLoading={updateDependencies.isPending}
      />
    </>
  )
}
