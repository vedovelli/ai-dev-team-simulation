import { useQueryClient } from '@tanstack/react-query'
import type { Task, UpdateTaskInput } from '../types/task'
import { useConflictAwareMutation } from './useConflictAwareMutation'

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useConflictAwareMutation({
    mutationFn: async ({ id, data, version }: { id: string; data: UpdateTaskInput; version: number }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, version }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 409) {
          throw new Error(`409: conflict with serverVersion: ${JSON.stringify(error.serverVersion || {})}`)
        }
        throw new Error(error.error || 'Failed to update task')
      }

      return response.json() as Promise<Task>
    },
    queryKeyFn: ({ id }) => ['tasks', id],
    onMutate: async ({ id, data, version }) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous tasks data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...data,
                  version: version + 1,
                  updatedAt: new Date().toISOString(),
                }
              : task
          )
        )
      })

      return { previousTasks }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: () => {
      // Refetch tasks to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // Invalidate activity feed since task state changed
      queryClient.invalidateQueries({ queryKey: ['activity', 'feed'] })
    },
  })
}
