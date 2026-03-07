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
  const sprintStartDate = new Date(data.sprint.startDate)
  const sprintEndDate = new Date(data.sprint.endDate)
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
 * Fetch and calculate sprint-level metrics
 * Uses stale-while-revalidate strategy for better UX
 */
export function useSprintMetrics(sprintId: string) {
  const query = useQuery<SprintHealthData, Error>({
    queryKey: ['sprintMetrics', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/metrics`)
      if (!response.ok) {
        throw new Error('Failed to fetch sprint metrics')
      }
      return response.json()
    },
    enabled: !!sprintId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
  })

  const calculated = query.data ? calculateMetrics(query.data) : null

  return {
    ...query,
    metrics: calculated,
  }
}
