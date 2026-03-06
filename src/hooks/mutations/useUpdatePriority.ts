import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { useMutationWithRetry } from '../useMutationWithRetry'

interface UpdatePriorityPayload {
  taskId: string
  priority: number
}

export function useUpdatePriority() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({ taskId, priority }: UpdatePriorityPayload) => {
      const response = await fetch(`/api/tasks/${taskId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update priority')
      }

      return response.json() as Promise<Task>
    },
    onMutate: async ({ taskId, priority }) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Convert priority number to TaskPriority string
      const priorityMap: Record<number, 'high' | 'medium' | 'low'> = {
        1: 'high',
        2: 'medium',
        3: 'low',
        4: 'low',
      }

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  priority: priorityMap[priority] || 'low',
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
    },
  })
}
