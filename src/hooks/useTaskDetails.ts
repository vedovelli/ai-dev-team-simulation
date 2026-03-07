import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '../types/task'

interface UseTaskDetailsOptions {
  taskId: string
}

/**
 * Custom hook for managing task detail queries and mutations.
 * Encapsulates task detail fetching and status update mutations with optimistic updates.
 *
 * @param options - Configuration including task ID
 * @returns Task detail query result and status update mutation
 *
 * @example
 * ```tsx
 * const { data: task, isLoading, updateTaskStatus } = useTaskDetails({ taskId: '123' })
 * ```
 */
export function useTaskDetails({ taskId }: UseTaskDetailsOptions) {
  const queryClient = useQueryClient()

  // Fetch task details
  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) throw new Error('Failed to fetch task')
      const data = await response.json()
      return data.data as Task
    },
    enabled: !!taskId,
  })

  // Mutation for updating task status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update task status')
      const data = await response.json()
      return data.data as Task
    },

    // Optimistic update
    onMutate: async (newStatus: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['task', taskId] })

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<Task>(['task', taskId])

      // Optimistically update the cache
      if (previousTask) {
        queryClient.setQueryData(['task', taskId], {
          ...previousTask,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        })
      }

      return { previousTask }
    },

    // Revert on error
    onError: (err, newStatus, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(['task', taskId], context.previousTask)
      }
    },

    // Refetch after success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      // Also refetch the task list since a task status changed
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] })
    },
  })

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    error: taskQuery.error,
    updateTaskStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  }
}
