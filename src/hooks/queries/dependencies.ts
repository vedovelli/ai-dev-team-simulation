import { useQuery } from '@tanstack/react-query'
import type { Task } from '../../types/task'

/**
 * Query keys factory for task dependency queries.
 * Follows TanStack Query best practices with structured cache keys for proper invalidation.
 */
export const dependencyKeys = {
  all: ['dependencies'] as const,
  lists: () => [...dependencyKeys.all, 'list'] as const,
  list: (taskId: string) => [...dependencyKeys.lists(), taskId] as const,
}

/**
 * Response format for dependency queries
 */
export interface TaskDependenciesResponse {
  taskId: string
  dependencies: Task[]
  blockers: Task[]
}

/**
 * Fetch task dependencies and blockers
 *
 * @param taskId - The task ID to fetch dependencies for
 * @returns Dependencies and blockers arrays with loading and error states
 *
 * @example
 * ```tsx
 * const { dependencies, blockers, isLoading } = useTaskDependencies(taskId)
 * ```
 */
export function useTaskDependencies(taskId: string) {
  return useQuery<TaskDependenciesResponse>({
    queryKey: dependencyKeys.list(taskId),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`)
      if (!response.ok) {
        throw new Error(`Failed to fetch dependencies for task ${taskId}`)
      }
      return response.json()
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!taskId,
  })
}
