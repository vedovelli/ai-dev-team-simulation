import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { TaskCard } from './TaskCard'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { useTasks } from '../hooks/useTasks'
import { useUpdateTask } from '../hooks/useUpdateTask'
import { useToast } from './Toast'
import type { Task, TaskStatus } from '../types/task'

type KanbanStatus = 'todo' | 'in-progress' | 'done'

const KANBAN_COLUMNS: KanbanStatus[] = ['todo', 'in-progress', 'done']
const KANBAN_LABELS: Record<KanbanStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
}

// Map TaskStatus to KanbanStatus
function mapTaskStatusToKanban(status: TaskStatus): KanbanStatus {
  const mapping: Record<TaskStatus, KanbanStatus> = {
    'backlog': 'todo',
    'in-progress': 'in-progress',
    'in-review': 'in-progress',
    'done': 'done',
  }
  return mapping[status]
}

// Map KanbanStatus to primary TaskStatus
function mapKanbanToTaskStatus(kanbanStatus: KanbanStatus): TaskStatus {
  const mapping: Record<KanbanStatus, TaskStatus> = {
    'todo': 'backlog',
    'in-progress': 'in-progress',
    'done': 'done',
  }
  return mapping[kanbanStatus]
}

function DroppableColumn({ id, taskIds, children }: {
  id: string
  taskIds: string[]
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`transition-colors ${isOver ? 'bg-blue-50' : ''}`}
      >
        {children}
      </div>
    </SortableContext>
  )
}

export function KanbanBoard() {
  const { data: tasks = [], isLoading, error, refetch } = useTasks()
  const updateTask = useUpdateTask()
  const { showToast } = useToast()
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const tasksByKanbanStatus = useMemo(() => {
    const grouped: Record<KanbanStatus, Task[]> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    }

    localTasks.forEach((task) => {
      const kanbanStatus = mapTaskStatusToKanban(task.status)
      grouped[kanbanStatus].push(task)
    })

    return grouped
  }, [localTasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const draggedTask = localTasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const targetKanbanStatus = over.id as KanbanStatus
    const targetTaskStatus = mapKanbanToTaskStatus(targetKanbanStatus)

    if (draggedTask.status === targetTaskStatus) {
      // No status change needed
      return
    }

    // Optimistically update
    setLocalTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === draggedTask.id
          ? { ...t, status: targetTaskStatus }
          : t
      )
    )

    setLoadingTaskIds((prev) => new Set(prev).add(draggedTask.id))

    updateTask.mutate(
      {
        id: draggedTask.id,
        data: { status: targetTaskStatus },
      },
      {
        onSuccess: () => {
          setLoadingTaskIds((prev) => {
            const next = new Set(prev)
            next.delete(draggedTask.id)
            return next
          })
          showToast(`Task moved to ${KANBAN_LABELS[targetKanbanStatus]}`, 'success')
        },
        onError: () => {
          setLocalTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === draggedTask.id
                ? { ...t, status: draggedTask.status }
                : t
            )
          )
          setLoadingTaskIds((prev) => {
            const next = new Set(prev)
            next.delete(draggedTask.id)
            return next
          })
          showToast('Failed to update task status', 'error')
        },
      }
    )
  }

  if (isLoading) {
    return <LoadingState message="Loading tasks..." />
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />
  }

  return (
    <div className="h-full bg-gray-50 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Kanban Board</h1>

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-3 gap-6">
          {KANBAN_COLUMNS.map((status) => {
            const statusTasks = tasksByKanbanStatus[status]
            const taskIds = statusTasks.map((t) => t.id)

            return (
              <div key={status} className="flex flex-col">
                <div className="mb-4">
                  <h2 className="font-semibold text-gray-700">
                    {KANBAN_LABELS[status]}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {statusTasks.length} task{statusTasks.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <DroppableColumn id={status} taskIds={taskIds}>
                  <div className="flex-1 space-y-3 rounded-lg bg-white p-4 shadow-sm">
                    {statusTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isLoading={loadingTaskIds.has(task.id)}
                      />
                    ))}
                    {statusTasks.length === 0 && (
                      <div className="rounded bg-gray-100 p-4 text-center text-sm text-gray-500">
                        No tasks
                      </div>
                    )}
                  </div>
                </DroppableColumn>
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
