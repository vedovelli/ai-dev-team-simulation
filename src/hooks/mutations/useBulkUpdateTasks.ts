import { useQueryClient } from '@tanstack/react-query'
import type { Task, UpdateTaskInput } from '../../types/task'
import { useMutationWithRetry } from '../useMutationWithRetry'

interface BulkUpdateTasksPayload {
  taskIds: string[]
  updates: UpdateTaskInput
}

interface BulkUpdateTasksResult {
  success: boolean
  results: Array<{
    taskId: string
    success: boolean
    error?: string
    task?: Task
  }>
  successCount: number
  failureCount: number
}

/**
 * Mutation hook for bulk updating tasks
 *
 * Features:
 * - Optimistic updates for selected tasks
 * - Automatic rollback on error
 * - Partial failure support (some tasks succeed, some fail)
 * - Smart query invalidation for affected lists
 * - Type-safe with full TypeScript support
 *
 * @example
 * ```tsx
 * const { mutate: bulkUpdate, isPending, error } = useBulkUpdateTasks()
 *
 * bulkUpdate(
 *   {
 *     taskIds: ['task-1', 'task-2', 'task-3'],
 *     updates: { status: 'done', priority: 'high' }
 *   },
 *   {
 *     onSuccess: (result) => {
 *       if (result.failureCount > 0) {
 *         showPartialSuccessToast(`Updated ${result.successCount} of ${result.successCount + result.failureCount}`)
 *       } else {
 *         showSuccessToast('All tasks updated')
 *       }
 *     },
 *     onError: (err) => showErrorToast(err.message),
 *   }
 * )
 * ```
 */
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({ taskIds, updates }: BulkUpdateTasksPayload) => {
      const response = await fetch('/api/tasks/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds, updates }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tasks')
      }

      return response.json() as Promise<BulkUpdateTasksResult>
    },

    onMutate: async ({ taskIds, updates }) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      await queryClient.cancelQueries({ queryKey: ['sprint'] })

      // Snapshot all affected task data and task lists
      const previousQueries = queryClient.getQueriesData({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          (query.queryKey[0] === 'tasks' ||
            query.queryKey[0] === 'sprint' ||
            query.queryKey[0] === 'task'),
      })

      // Optimistically update all task lists and detail caches
      previousQueries.forEach(([key]) => {
        if (Array.isArray(key) && key[0] === 'task' && key.length === 2) {
          // Handle single task detail: ['task', taskId]
          const taskId = key[1]
          if (taskIds.includes(taskId as string)) {
            queryClient.setQueryData(key, (oldTask: Task | undefined) => {
              if (!oldTask) return oldTask
              return {
                ...oldTask,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            })
          }
        } else if (Array.isArray(key) && key[0] === 'tasks') {
          // Handle task lists: ['tasks', ...] or ['sprint', sprintId, 'tasks']
          queryClient.setQueryData(key, (oldTasks: Task[] | undefined) => {
            if (!oldTasks) return oldTasks
            return oldTasks.map((task) => {
              if (taskIds.includes(task.id)) {
                return {
                  ...task,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              }
              return task
            })
          })
        }
      })

      return { previousQueries }
    },

    onError: (_, __, context) => {
      // Revert all optimistic updates on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },

    onSuccess: () => {
      // Invalidate all affected caches to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['sprint'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
    },
  })
}
