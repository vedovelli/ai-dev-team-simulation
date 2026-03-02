import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../types/task'
import { useMutationWithRetry } from './useMutationWithRetry'

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      return response.json() as Promise<Task>
    },
    onMutate: async (id) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous tasks data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Optimistically remove the task from all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.filter((task) => task.id !== id)
        )
      })

      return { previousTasks }
    },
    onError: (_, __, context) => {
      // Revert optimistic deletion on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: () => {
      // Refetch tasks to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
