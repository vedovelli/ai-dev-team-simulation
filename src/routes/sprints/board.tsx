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
  const { data: allTasks = [], isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    setTasks(allTasks)
  }, [allTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (status !== null && task.status !== status) return false
      if (priority !== null && task.priority !== priority) return false
      if (
        search &&
        !task.title.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (team && task.team !== team) return false
      if (sprint && task.sprint !== sprint) return false
      if (assignee && task.assignee !== assignee) return false
      return true
    })
  }, [tasks, status, priority, search, team, sprint, assignee])

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

    const task = filteredTasks.find((t) => t.id === active.id)
    if (!task) return

    const newStatus = over.id as TaskStatus

    if (task.status !== newStatus) {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, status: newStatus } : t
        )
      )

      setLoadingTaskIds((prev) => new Set(prev).add(task.id))

      updateTask.mutate(
        {
          id: task.id,
          data: { status: newStatus },
        },
        {
          onSuccess: () => {
            setLoadingTaskIds((prev) => {
              const next = new Set(prev)
              next.delete(task.id)
              return next
            })
            showToast(`Task moved to ${STATUS_LABELS[newStatus]}`, 'success')
          },
          onError: () => {
            setTasks((prevTasks) =>
              prevTasks.map((t) =>
                t.id === task.id ? { ...t, status: task.status } : t
              )
            )
            setLoadingTaskIds((prev) => {
              const next = new Set(prev)
              next.delete(task.id)
              return next
            })
            showToast('Failed to update task status', 'error')
          },
        }
      )
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
                      <DraggableTask
                        key={task.id}
                        task={task}
                        isLoading={loadingTaskIds.has(task.id)}
                      />
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
