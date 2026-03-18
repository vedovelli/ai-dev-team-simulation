import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { dependencyKeys } from '../queries/dependencies'
import { detectCircularDependency } from '../../utils/dependencyValidation'

/**
 * Re-export detectCircularDependency for backward compatibility
 */
export { detectCircularDependency }

interface DependencyVariables {
  taskId: string
  dependsOnTaskId: string
}

interface DependencyMutationsReturn {
  addDependency: (
    variables: DependencyVariables,
    options?: { onError?: (error: Error) => void; onSuccess?: () => void }
  ) => void
  removeDependency: (
    variables: DependencyVariables,
    options?: { onError?: (error: Error) => void; onSuccess?: () => void }
  ) => void
  addDependencyAsync: (variables: DependencyVariables) => Promise<Task>
  removeDependencyAsync: (variables: DependencyVariables) => Promise<Task>
  updateBlockingStatus: (
    taskId: string,
    options?: { onError?: (error: Error) => void; onSuccess?: () => void }
  ) => void
  updateBlockingStatusAsync: (taskId: string) => Promise<Record<string, unknown>>
  isPending: boolean
}

/**
 * Hook for managing task dependencies with optimistic updates
 *
 * Features:
 * - Circular dependency detection before mutation
 * - Automatic cache invalidation of all dependency queries
 * - Fresh validation data from query client
 * - Type-safe mutations
 *
 * Note: This hook fetches all tasks from the query client to ensure
 * validation is performed against current data, not stale snapshots.
 *
 * @returns Mutation functions and loading state
 *
 * @example
 * ```tsx
 * const { addDependency, removeDependency, isPending } = useDependencyMutations()
 *
 * const handleAdd = () => {
 *   addDependency({ taskId: 'task-1', dependsOnTaskId: 'task-2' }, {
 *     onError: (error) => showError(error.message)
 *   })
 * }
 * ```
 */
export function useDependencyMutations(): DependencyMutationsReturn {
  const queryClient = useQueryClient()

  const addDependencyMutation = useMutation<Task, Error, DependencyVariables>({
    mutationFn: async (variables) => {
      // Get fresh task data from query client for validation
      const allTasksData = queryClient.getQueryData<Task[]>(['tasks'])
      if (!allTasksData) {
        throw new Error('Task data not available in cache. Ensure tasks are loaded.')
      }

      // Convert to Map for validation
      const tasksMap = new Map(allTasksData.map((t) => [t.id, t]))

      // Validate for circular dependency using fresh data
      const circularError = detectCircularDependency(
        variables.taskId,
        variables.dependsOnTaskId,
        tasksMap
      )

      if (circularError) {
        throw new Error(circularError)
      }

      const response = await fetch(`/api/tasks/${variables.taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependsOnTaskId: variables.dependsOnTaskId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add dependency')
      }

      return response.json() as Promise<Task>
    },

    onSuccess: (updatedTask) => {
      // Invalidate all dependency queries for this task
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.detail(updatedTask.id),
      })

      // Also invalidate dependent tasks' dependency queries
      const allTasksData = queryClient.getQueryData<Task[]>(['tasks'])
      if (allTasksData) {
        allTasksData.forEach((task) => {
          if (task.dependsOn?.includes(updatedTask.id)) {
            queryClient.invalidateQueries({
              queryKey: dependencyKeys.detail(task.id),
            })
          }
        })
      }
    },
  })

  const removeDependencyMutation = useMutation<Task, Error, DependencyVariables>({
    mutationFn: async (variables) => {
      const response = await fetch(
        `/api/tasks/${variables.taskId}/dependencies/${variables.dependsOnTaskId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove dependency')
      }

      return response.json() as Promise<Task>
    },

    onSuccess: (updatedTask) => {
      // Invalidate all dependency queries for this task
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.detail(updatedTask.id),
      })

      // Also invalidate dependent tasks' dependency queries
      const allTasksData = queryClient.getQueryData<Task[]>(['tasks'])
      if (allTasksData) {
        allTasksData.forEach((task) => {
          if (task.dependsOn?.includes(updatedTask.id)) {
            queryClient.invalidateQueries({
              queryKey: dependencyKeys.detail(task.id),
            })
          }
        })
      }
    },
  })

  const blockingStatusMutation = useMutation<Record<string, unknown>, Error, string>({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/blocking-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update blocking status')
      }

      return response.json() as Promise<Record<string, unknown>>
    },

    onSuccess: (_, taskId) => {
      // Invalidate dependency queries for this task and all dependents
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.detail(taskId),
      })

      const allTasksData = queryClient.getQueryData<Task[]>(['tasks'])
      if (allTasksData) {
        allTasksData.forEach((task) => {
          if (task.dependsOn?.includes(taskId)) {
            queryClient.invalidateQueries({
              queryKey: dependencyKeys.detail(task.id),
            })
          }
        })
      }
    },
  })

  return {
    addDependency: addDependencyMutation.mutate,
    removeDependency: removeDependencyMutation.mutate,
    addDependencyAsync: addDependencyMutation.mutateAsync,
    removeDependencyAsync: removeDependencyMutation.mutateAsync,
    updateBlockingStatus: blockingStatusMutation.mutate,
    updateBlockingStatusAsync: blockingStatusMutation.mutateAsync,
    isPending:
      addDependencyMutation.isPending ||
      removeDependencyMutation.isPending ||
      blockingStatusMutation.isPending,
  }
}
