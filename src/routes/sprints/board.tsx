import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
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
import { useTasks } from '../../hooks/useTasks'
import { useUpdateTask } from '../../hooks/useUpdateTask'
import type { Task, TaskStatus, TaskPriority } from '../../types/task'

const STATUSES: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
}
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const isValidStatus = (value: unknown): value is TaskStatus => {
  return value !== null && value !== undefined && value in STATUS_LABELS
}

const isValidPriority = (value: unknown): value is TaskPriority => {
  return value !== null && value !== undefined && value in PRIORITY_LABELS
}

export function TaskBoard() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/sprints/' })
  const { data: allTasks = [], isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const [tasks, setTasks] = useState<Task[]>([])

  const sensors = useSensors(useSensor(PointerSensor))

  const statusFilter = isValidStatus(searchParams.status) ? searchParams.status : null
  const priorityFilter = isValidPriority(searchParams.priority) ? searchParams.priority : null
  const searchFilter = searchParams.search || ''

  useEffect(() => {
    setTasks(allTasks)
  }, [allTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== null && task.status !== statusFilter) return false
      if (priorityFilter !== null && task.priority !== priorityFilter) return false
      if (
        searchFilter &&
        !task.title.toLowerCase().includes(searchFilter.toLowerCase())
      )
        return false
      return true
    })
  }, [tasks, statusFilter, priorityFilter, searchFilter])

  const handleStatusChange = (status: TaskStatus | null) => {
    navigate({
      to: '/sprints/',
      search: {
        status: status || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
      },
    })
  }

  const handlePriorityChange = (priority: TaskPriority | null) => {
    navigate({
      to: '/sprints/',
      search: {
        status: statusFilter || undefined,
        priority: priority || undefined,
        search: searchFilter || undefined,
      },
    })
  }

  const handleSearchChange = (search: string) => {
    navigate({
      to: '/sprints/',
      search: {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      },
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const task = filteredTasks.find((t) => t.id === active.id)
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

      <TaskFilters
        status={statusFilter}
        priority={priorityFilter}
        search={searchFilter}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onSearchChange={handleSearchChange}
      />

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-4 gap-6">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col">
              <h2 className="mb-4 font-semibold text-gray-700">
                {STATUS_LABELS[status]}
              </h2>
              <Droppable id={status}>
                <div className="flex-1 space-y-3 rounded-lg bg-white p-4 shadow-sm">
                  {filteredTasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <DraggableTask key={task.id} task={task} />
                    ))}
                  {filteredTasks.filter((task) => task.status === status)
                    .length === 0 && (
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
