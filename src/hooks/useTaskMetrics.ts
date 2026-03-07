/**
 * Task Metrics Hook
 *
 * Fetches task-related metrics using useQueries for parallel data loading.
 * Designed to work with suspense boundaries for progressive loading.
 *
 * Endpoints:
 * - GET /api/tasks/queue - task queue and history
 */

import { useQueries } from '@tanstack/react-query'
import type { Task, TaskStatus } from '../types/task'

export type TaskMetricStatus = 'backlog' | 'in-progress' | 'completed' | 'in-review'

export interface TaskMetric {
  id: string
  title: string
  status: TaskMetricStatus
  assignedAgent: string
  priority: string
  createdAt: string
  completedAt?: string
  duration?: number
}

interface UseTaskMetricsResult {
  tasks: TaskMetric[] | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const TASK_CACHE_CONFIG = {
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes
}

/**
 * Hook for fetching task metrics in parallel
 *
 * Uses TanStack Query's useQueries to fetch task data simultaneously with
 * other dashboard metrics. Supports progressive loading with suspense.
 *
 * Transforms Task data to TaskMetric format for dashboard display.
 *
 * @returns Object containing task data and query state
 */
export function useTaskMetrics(): UseTaskMetricsResult {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['tasks', 'queue'],
        queryFn: async () => {
          const response = await fetch('/api/tasks/queue')
          if (!response.ok) {
            throw new Error(`Failed to fetch task queue: ${response.status}`)
          }
          const tasks = (await response.json()) as Task[]

          // Transform Task to TaskMetric with type-safe status mapping
          const STATUS_MAP: Record<TaskStatus, TaskMetricStatus> = {
            'done': 'completed',
            'in-review': 'in-review',
            'in-progress': 'in-progress',
            'backlog': 'backlog',
          }

          return tasks.map((task) => {
            const mappedStatus = STATUS_MAP[task.status]
            if (!mappedStatus) {
              throw new Error(`Unknown task status: ${task.status}`)
            }
            return {
              id: task.id,
              title: task.title,
              status: mappedStatus,
              assignedAgent: task.assignee || 'unassigned',
              priority: task.priority,
              createdAt: task.createdAt,
              duration: task.estimatedHours ? Math.round(task.estimatedHours * 60) : 0,
            }
          }) as TaskMetric[]
        },
        ...TASK_CACHE_CONFIG,
      },
    ],
  })

  const [tasksQuery] = queries

  const isLoading = queries.some((query) => query.isLoading)
  const isError = queries.some((query) => query.isError)
  const error = queries.find((query) => query.error)?.error || null

  const refetch = async () => {
    await Promise.all(queries.map((query) => query.refetch()))
  }

  return {
    tasks: tasksQuery.data,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Cache Invalidation Pattern for Tasks
 *
 * Invalidate task queries when task status changes:
 *
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * const queryClient = useQueryClient()
 *
 * // After task completion
 * queryClient.invalidateQueries({ queryKey: ['tasks'] })
 *
 * // After task assignment
 * queryClient.invalidateQueries({ queryKey: ['tasks', 'queue'] })
 * ```
 */
