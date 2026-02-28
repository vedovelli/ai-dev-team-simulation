import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  closestDroppableOfType,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/utilities'
import { Droppable } from './Droppable'
import { DraggableTask } from './DraggableTask'
import { useTasks } from '../../hooks/useTasks'
import { useUpdateTask } from '../../hooks/useUpdateTask'
import type { Task, TaskStatus } from '../../types/task'

const STATUSES: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}

export function TaskBoard() {
  const { data: allTasks = [], isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const [tasks, setTasks] = useState<Task[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  )

  useEffect(() => {
    setTasks(allTasks)
  }, [allTasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const task = tasks.find((t) => t.id === active.id)
    if (!task) return

    const newStatus = over.id as TaskStatus

    if (task.status !== newStatus) {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      )

      updateTask.mutate({
        id: task.id,
        data: { status: newStatus },
      })
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading tasks...</div>
  }

  return (
    <div className="h-full bg-gray-50 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Task Board</h1>

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestDroppableOfType}
      >
        <div className="grid grid-cols-4 gap-6">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col">
              <h2 className="mb-4 font-semibold text-gray-700">
                {STATUS_LABELS[status]}
              </h2>
              <Droppable id={status}>
                <div className="flex-1 space-y-3 rounded-lg bg-white p-4 shadow-sm">
                  {tasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <DraggableTask key={task.id} task={task} />
                    ))}
                  {tasks.filter((task) => task.status === status).length === 0 && (
                    <div className="rounded bg-gray-100 p-4 text-center text-sm text-gray-500">
                      No tasks
                    </div>
                  )}
                </div>
              </Droppable>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
