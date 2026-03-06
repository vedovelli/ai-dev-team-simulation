import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { useMutationWithRetry } from '../useMutationWithRetry'

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete task')
      }

      return response.json() as Promise<Task>
    },
    onMutate: async (taskId) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'done' as const,
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
    },
  })
}
