/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { Task, TaskStatus } from '../types/task'

export const Route = createFileRoute('/tasks')({
  component: TaskQueuePage,
})

const TASK_STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done']

function TaskQueuePage() {
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json() as Promise<Task[]>
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string
      status: TaskStatus
    }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      return response.json() as Promise<Task>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Task Queue</h1>
        <div className="text-center">Loading tasks...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Task Queue</h1>
        <div className="text-red-500">
          Error loading tasks: {(error as Error).message}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Task Queue</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">
              {status}
            </h2>
            <div className="space-y-2">
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={(newStatus) => {
                      updateTaskMutation.mutate({
                        taskId: task.id,
                        status: newStatus,
                      })
                    }}
                    isUpdating={updateTaskMutation.isPending}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function TaskCard({
  task,
  onStatusChange,
  isUpdating,
}: {
  task: Task
  onStatusChange: (status: TaskStatus) => void
  isUpdating: boolean
}) {
  return (
    <div className="bg-slate-700 rounded p-3 text-sm">
      <h3 className="font-medium mb-1 line-clamp-2">{task.title}</h3>
      <p className="text-slate-300 text-xs mb-3 line-clamp-2">
        {task.description}
      </p>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
        disabled={isUpdating}
        className="w-full px-2 py-1 text-xs bg-slate-600 text-white rounded border border-slate-500 disabled:opacity-50 cursor-pointer hover:bg-slate-500"
      >
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  )
}
