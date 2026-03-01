import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Droppable } from './Droppable'
import { DraggableTask } from './DraggableTask'
import { TaskFilters } from '../../components/TaskFilters'
import { useTaskFilters } from '../../hooks/useTaskFilters'
import { useTasks } from '../../hooks/useTasks'
import { useUpdateTask } from '../../hooks/useUpdateTask'
import { useTaskReorder } from '../../hooks/useTaskReorder'
import { useToast } from '../../components/Toast'
import type { Task, TaskStatus } from '../../types/task'

const STATUSES: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}

export function TaskBoard() {
  const {
    status,
    priority,
    search,
    team,
    sprint,
    assignee,
    updateFilter,
    clearAllFilters,
  } = useTaskFilters()
  const { data: allTasks = [], isLoading } = useTasks({
    status: status || undefined,
    priority: priority || undefined,
    search: search || undefined,
    team: team || undefined,
    sprint: sprint || undefined,
    assignee: assignee || undefined,
  })
  const updateTask = useUpdateTask()
  const reorderTasks = useTaskReorder()
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    setTasks(allTasks)
  }, [allTasks])

  const filteredTasks = useMemo(() => {
    return tasks
  }, [tasks])

  const handleStatusChange = (newStatus: TaskStatus | null) => {
    updateFilter({ status: newStatus })
  }

  const handlePriorityChange = (newPriority: any | null) => {
    updateFilter({ priority: newPriority })
  }

  const handleSearchChange = (newSearch: string) => {
    updateFilter({ search: newSearch })
  }

  const handleTeamChange = (newTeam: string) => {
    updateFilter({ team: newTeam })
  }

  const handleSprintChange = (newSprint: string) => {
    updateFilter({ sprint: newSprint })
  }

  const handleAssigneeChange = (newAssignee: string) => {
    updateFilter({ assignee: newAssignee })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const draggedTask = filteredTasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const overStatus = over.id as TaskStatus
    const isStatusChange = draggedTask.status !== overStatus

    // Get all tasks in the target status (including filtered and unfiltered)
    const targetStatusTasks = tasks.filter((t) => t.status === overStatus)

    if (isStatusChange) {
      // Moving to a different column
      const newOrder = targetStatusTasks.length
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === draggedTask.id
            ? { ...t, status: overStatus, order: newOrder }
            : t
        )
      )

      setLoadingTaskIds((prev) => new Set(prev).add(draggedTask.id))

      updateTask.mutate(
        {
          id: draggedTask.id,
          data: { status: overStatus, order: newOrder },
        },
        {
          onSuccess: () => {
            setLoadingTaskIds((prev) => {
              const next = new Set(prev)
              next.delete(draggedTask.id)
              return next
            })
            showToast(`Task moved to ${STATUS_LABELS[overStatus]}`, 'success')
          },
          onError: () => {
            setTasks((prevTasks) =>
              prevTasks.map((t) =>
                t.id === draggedTask.id
                  ? { ...t, status: draggedTask.status, order: draggedTask.order }
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
    } else {
      // Reordering within the same column
      const overTask = filteredTasks.find((t) => t.id === over.id)
      if (!overTask || overTask.status !== draggedTask.status) return

      // Create a new ordered list for this status
      const statusTasksInOrder = filteredTasks
        .filter((t) => t.status === overStatus)
        .sort((a, b) => a.order - b.order)

      const oldIndex = statusTasksInOrder.findIndex(
        (t) => t.id === draggedTask.id
      )
      const newIndex = statusTasksInOrder.findIndex((t) => t.id === overTask.id)

      if (oldIndex === newIndex) return

      // Reorder array
      const reordered = [...statusTasksInOrder]
      const [movedItem] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, movedItem)

      // Update orders and state
      const updates = reordered.map((task, index) => ({
        id: task.id,
        data: { order: index },
      }))

      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          const newOrder = updates.find((u) => u.id === task.id)?.data.order
          return newOrder !== undefined
            ? { ...task, order: newOrder }
            : task
        })
      )

      updates.forEach((update) => {
        setLoadingTaskIds((prev) => new Set(prev).add(update.id))
      })

      reorderTasks.mutate(updates, {
        onSuccess: () => {
          updates.forEach((update) => {
            setLoadingTaskIds((prev) => {
              const next = new Set(prev)
              next.delete(update.id)
              return next
            })
          })
          showToast('Tasks reordered', 'success')
        },
        onError: () => {
          // Revert to original order
          setTasks((prevTasks) =>
            prevTasks.map((task) => {
              const original = statusTasksInOrder.find((t) => t.id === task.id)
              return original
                ? { ...task, order: original.order }
                : task
            })
          )
          updates.forEach((update) => {
            setLoadingTaskIds((prev) => {
              const next = new Set(prev)
              next.delete(update.id)
              return next
            })
          })
          showToast('Failed to reorder tasks', 'error')
        },
      })
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading tasks...</div>
  }

  return (
    <div className="h-full bg-gray-50 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Task Board</h1>

      <TaskFilters
        status={status}
        priority={priority}
        search={search}
        team={team}
        sprint={sprint}
        assignee={assignee}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onSearchChange={handleSearchChange}
        onTeamChange={handleTeamChange}
        onSprintChange={handleSprintChange}
        onAssigneeChange={handleAssigneeChange}
        onClearFilters={clearAllFilters}
      />

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-4 gap-6">
          {STATUSES.map((status) => {
            const statusTasks = filteredTasks
              .filter((task) => task.status === status)
              .sort((a, b) => a.order - b.order)
            const taskIds = statusTasks.map((t) => t.id)

            return (
              <div key={status} className="flex flex-col">
                <h2 className="mb-4 font-semibold text-gray-700">
                  {STATUS_LABELS[status]}
                </h2>
                <Droppable id={status} items={taskIds}>
                  <div className="flex-1 space-y-3 rounded-lg bg-white p-4 shadow-sm">
                    {statusTasks.map((task) => (
                      <DraggableTask
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
                </Droppable>
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
