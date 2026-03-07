import { useQuery } from '@tanstack/react-query'
import type { SprintHealthData } from '../types/sprint'

export interface SprintMetricsCalculated {
  totalTasks: number
  completedTasks: number
  remainingTasks: number
  inProgressTasks: number
  completionPercentage: number
  averageTaskCompletionTime: number
  tasksPerDay: number
  projectedCompletionDate?: string
}

/**
 * Calculate sprint-level metrics from raw sprint data
 * Metrics include completion percentage, projected completion date, and throughput
 */
function calculateMetrics(data: SprintHealthData): SprintMetricsCalculated {
  const totalTasks = data.summary.totalTasks
  const completedTasks = data.summary.completedTasks
  const inProgressTasks = data.summary.inProgressTasks || 0
  const remainingTasks = totalTasks - completedTasks - inProgressTasks

  const completionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  // Calculate average time to complete a task (in hours)
  const sprintStartDate = new Date(data.sprint.startDate || new Date())
  const sprintEndDate = new Date(data.sprint.endDate || new Date())
  const totalSprintDays = (sprintEndDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24)

  const elapsedDays = (new Date().getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24)
  const averageTaskCompletionTime = completedTasks > 0
    ? Math.round((elapsedDays * 24) / completedTasks)
    : 0

  const tasksPerDay = elapsedDays > 0
    ? Math.round((completedTasks / elapsedDays) * 10) / 10
    : 0

  // Project completion date
  let projectedCompletionDate: string | undefined
  if (tasksPerDay > 0 && remainingTasks > 0) {
    const daysUntilCompletion = Math.ceil(remainingTasks / tasksPerDay)
    const projected = new Date()
    projected.setDate(projected.getDate() + daysUntilCompletion)

    // Only show projection if it's within the sprint window
    if (projected.getTime() <= sprintEndDate.getTime()) {
      projectedCompletionDate = projected.toISOString()
    }
  }

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    inProgressTasks,
    completionPercentage,
    averageTaskCompletionTime,
    tasksPerDay,
    projectedCompletionDate,
  }
}

/**
 * Fetch and calculate sprint-level metrics with real-time polling
 *
 * Features:
 * - Automatic polling every 30 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy for better UX
 * - Handles missing/incomplete data gracefully
 * - Includes error handling and retry logic
 */
export interface UseSprintMetricsOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch (default: true) */
  refetchOnWindowFocus?: boolean
}

export function useSprintMetrics(sprintId: string, options: UseSprintMetricsOptions = {}) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
  } = options

  const query = useQuery<SprintHealthData, Error>({
    queryKey: ['sprints', sprintId, 'metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/metrics`)
      if (!response.ok) {
        throw new Error(`Failed to fetch sprint metrics: ${response.statusText}`)
      }
      return response.json() as Promise<SprintHealthData>
    },
    enabled: !!sprintId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchInterval, // Polling configuration
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  const calculated = query.data ? calculateMetrics(query.data) : null

  return {
    ...query,
    metrics: calculated,
  }
}
