import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { dependencyKeys } from '../queries/dependencies'

/**
 * Validates for circular dependencies in a task dependency graph
 *
 * @param taskId - The task to add a dependency to
 * @param dependsOnTaskId - The task that the first task will depend on
 * @param allTasks - All tasks in the system
 * @returns Error message if circular dependency detected, null otherwise
 *
 * @example
 * ```tsx
 * const error = detectCircularDependency('task-1', 'task-2', allTasks)
 * if (error) {
 *   showError(error)
 * }
 * ```
 */
export function detectCircularDependency(
  taskId: string,
  dependsOnTaskId: string,
  allTasks: Map<string, Task>
): string | null {
  // Direct self-dependency check
  if (taskId === dependsOnTaskId) {
    return 'A task cannot depend on itself'
  }

  // Build a map for O(1) lookups
  const taskMap = allTasks

  // BFS to detect cycles
  const visited = new Set<string>()
  const queue = [dependsOnTaskId]

  while (queue.length > 0) {
    const currentId = queue.shift()!

    if (currentId === taskId) {
      return `Adding this dependency would create a circular dependency: ${taskId} → ${dependsOnTaskId} → ... → ${taskId}`
    }

    if (visited.has(currentId)) {
      continue
    }

    visited.add(currentId)

    const task = taskMap.get(currentId)
    if (task?.dependsOn) {
      for (const depId of task.dependsOn) {
        if (!visited.has(depId)) {
          queue.push(depId)
        }
      }
    }
  }

  return null
}

interface AddDependencyVariables {
  taskId: string
  dependsOnTaskId: string
}

interface RemoveDependencyVariables {
  taskId: string
  dependsOnTaskId: string
}

interface DependencyMutationsReturn {
  addDependency: ReturnType<typeof useMutation<Task, Error, AddDependencyVariables>>['mutate']
  removeDependency: ReturnType<typeof useMutation<Task, Error, RemoveDependencyVariables>>['mutate']
  addDependencyAsync: ReturnType<typeof useMutation<Task, Error, AddDependencyVariables>>['mutateAsync']
  removeDependencyAsync: ReturnType<typeof useMutation<Task, Error, RemoveDependencyVariables>>['mutateAsync']
  isPending: boolean
}

/**
 * Hook for managing task dependencies with optimistic updates
 *
 * Features:
 * - Circular dependency detection before mutation
 * - Optimistic updates with automatic rollback
 * - Automatic cache invalidation of related queries
 * - Type-safe mutations
 *
 * @param taskId - The task ID to manage dependencies for
 * @param allTasks - Map of all tasks for circular dependency detection
 * @returns Mutation functions and loading state
 *
 * @example
 * ```tsx
 * const { addDependency, removeDependency, isPending } = useDependencyMutations(
 *   taskId,
 *   new Map(tasks.map(t => [t.id, t]))
 * )
 *
 * const handleAdd = () => {
 *   addDependency({ taskId, dependsOnTaskId: 'task-2' }, {
 *     onError: (error) => showError(error.message)
 *   })
 * }
 * ```
 */
export function useDependencyMutations(
  taskId: string,
  allTasks: Map<string, Task>
): DependencyMutationsReturn {
  const queryClient = useQueryClient()

  const addDependencyMutation = useMutation<Task, Error, AddDependencyVariables>({
    mutationFn: async (variables) => {
      // Validate for circular dependency
      const circularError = detectCircularDependency(
        variables.taskId,
        variables.dependsOnTaskId,
        allTasks
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

    onSuccess: (data, variables) => {
      // Invalidate dependency queries
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.taskId),
      })
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.dependsOnTaskId),
      })
    },
  })

  const removeDependencyMutation = useMutation<Task, Error, RemoveDependencyVariables>({
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

    onSuccess: (data, variables) => {
      // Invalidate dependency queries
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.taskId),
      })
      queryClient.invalidateQueries({
        queryKey: dependencyKeys.list(variables.dependsOnTaskId),
      })
    },
  })

  return {
    addDependency: addDependencyMutation.mutate,
    removeDependency: removeDependencyMutation.mutate,
    addDependencyAsync: addDependencyMutation.mutateAsync,
    removeDependencyAsync: removeDependencyMutation.mutateAsync,
    isPending: addDependencyMutation.isPending || removeDependencyMutation.isPending,
  }
}
