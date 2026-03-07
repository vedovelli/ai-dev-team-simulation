import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { useOptimisticMutation } from '../useOptimisticMutation'

interface UpdateTaskStatusVariables {
  taskId: string
  sprintId: string
  status: Task['status']
}

/**
 * Hook for updating task status with optimistic updates and rollback
 *
 * Features:
 * - Immediate UI update before server confirmation
 * - Automatic rollback if the update fails
 * - Updates all related caches (task detail, sprint tasks, sprint metrics)
 * - Type-safe with full TypeScript support
 *
 * @example
 * ```tsx
 * const { mutate: updateStatus, isPending } = useUpdateTaskStatusOptimistic(sprintId, taskId)
 *
 * updateStatus(
 *   { sprintId, taskId, status: 'done' },
 *   {
 *     onSuccess: () => showToast('Task updated'),
 *     onError: () => showToast('Failed to update task'),
 *   }
 * )
 * ```
 */
export function useUpdateTaskStatusOptimistic(sprintId: string, taskId: string) {
  const queryClient = useQueryClient()

  return useOptimisticMutation<Task, Error, UpdateTaskStatusVariables>({
    mutationFn: async (variables) => {
      const response = await fetch(`/api/tasks/${variables.taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: variables.status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task status')
      }

      return response.json() as Promise<Task>
    },

    optimisticUpdate: (variables, currentData) => ({
      ...currentData!,
      status: variables.status,
      updatedAt: new Date().toISOString(),
    }),

    queryKey: ['task', taskId],

    invalidateKeys: (data, variables) => [
      // Invalidate the specific task detail query
      ['task', variables.taskId],
      // Invalidate all sprint task lists
      ['sprint', variables.sprintId, 'tasks'],
      // Invalidate sprint metrics (affects counts and burndown)
      ['sprint', variables.sprintId, 'metrics'],
      // Invalidate sprint detail
      ['sprint', variables.sprintId],
    ],
  })
}
