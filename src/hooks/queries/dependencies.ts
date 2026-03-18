import { useQuery } from '@tanstack/react-query'
import type { Task } from '../../types/task'

/**
 * Query keys factory for task dependency queries.
 * Follows TanStack Query best practices with structured cache keys for proper invalidation.
 */
export const dependencyKeys = {
  all: ['tasks'] as const,
  dependencies: () => ['tasks', 'dependencies'] as const,
  detail: (taskId: string) => ['tasks', taskId, 'dependencies'] as const,
  // Backward compatibility
  lists: () => ['tasks', 'dependencies'] as const,
  list: (taskId: string) => ['tasks', taskId, 'dependencies'] as const,
}

/**
 * Response format for dependency queries
 */
export interface BlockingStatus {
  isBlocked: boolean
  blockedDependencies: Array<{ id: string; title: string; status: string }>
  transitivelyBlockedCount: number
}

export interface TaskDependenciesResponse {
  taskId: string
  dependencies: Task[]
  blockers: Task[]
  isBlocked: boolean
  blockingStatus: BlockingStatus
}

/**
 * Fetch task dependencies and blockers with blocking status
 *
 * Features:
 * - Fetches full dependency chain and blocking relationships
 * - Computes transitive blocking: if A blocks B and B blocks C, C is indirectly blocked
 * - Validates blocking status (is task blocked? is it blocking others?)
 * - Exponential backoff retry with 3 attempts
 * - Stale-while-revalidate strategy
 *
 * @param taskId - The task ID to fetch dependencies for
 * @returns Dependencies, blockers, and blocking status with loading and error states
 *
 * @example
 * ```tsx
 * const {
 *   data: { dependencies, blockers, isBlocked, blockingStatus },
 *   isLoading,
 *   error
 * } = useTaskDependencies(taskId)
 *
 * // Use blocking status to prevent completing blocked tasks
 * if (isBlocked) {
 *   // Show which dependencies are blocking this task
 *   console.log(blockingStatus.blockedDependencies)
 * }
 * ```
 */
export function useTaskDependencies(taskId: string) {
  return useQuery<TaskDependenciesResponse>({
    queryKey: dependencyKeys.detail(taskId),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`)
      if (!response.ok) {
        throw new Error(`Failed to fetch dependencies for task ${taskId}`)
      }
      return response.json() as Promise<TaskDependenciesResponse>
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    enabled: !!taskId,
  })
}
