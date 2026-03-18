import { useQueries } from '@tanstack/react-query'
import type { SprintHealthData, SprintMetrics } from '../types/sprint'
import type { SprintComparisonResult, UseSprintComparisonOptions, UseSprintComparisonReturn, TrendDirection, MetricDelta } from '../types/sprint-comparison'

/**
 * Calculate the trend direction for a metric
 * Compares current value to previous value and returns the trend
 */
function calculateTrend(currentValue: number, previousValue: number | null): TrendDirection {
  if (previousValue === null || previousValue === 0) {
    return 'neutral'
  }

  if (currentValue > previousValue) {
    return 'up'
  } else if (currentValue < previousValue) {
    return 'down'
  }

  return 'neutral'
}

/**
 * Calculate percentage change between current and previous values
 */
function calculatePercentageChange(currentValue: number, previousValue: number | null): number | undefined {
  if (previousValue === null || previousValue === 0) {
    return undefined
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100)
}

/**
 * Extract SprintMetrics from SprintHealthData
 * Safe extraction with null coalescing
 */
function extractMetrics(data: SprintHealthData | null): SprintMetrics | null {
  if (!data || !data.metrics) {
    return null
  }
  return data.metrics
}

/**
 * Compare current and previous sprint metrics
 * Generates delta values with trends and percentage changes
 */
function compareMetrics(current: SprintMetrics, previous: SprintMetrics | null): SprintComparisonResult['deltas'] {
  const previousVelocity = previous?.velocity ?? null
  const previousCompletionRate = previous?.completionPercentage ?? null
  const previousTasksCompleted = previous?.completedPoints ?? null

  return {
    velocity: {
      value: current.velocity - (previousVelocity ?? 0),
      trend: calculateTrend(current.velocity, previousVelocity),
      percentageChange: calculatePercentageChange(current.velocity, previousVelocity),
    },
    completionRate: {
      value: current.completionPercentage - (previousCompletionRate ?? 0),
      trend: calculateTrend(current.completionPercentage, previousCompletionRate),
      percentageChange: calculatePercentageChange(current.completionPercentage, previousCompletionRate),
    },
    tasksCompleted: {
      value: current.completedPoints - (previousTasksCompleted ?? 0),
      trend: calculateTrend(current.completedPoints, previousTasksCompleted),
      percentageChange: calculatePercentageChange(current.completedPoints, previousTasksCompleted),
    },
  }
}

/**
 * Fetch and compare metrics for current and previous sprint
 * Gracefully handles missing previous sprint data (returns current only)
 *
 * Features:
 * - Parallel fetching with useQueries for current + previous sprint metrics
 * - Handles partial data (current loaded, previous still fetching)
 * - Error boundary: returns current metrics if previous unavailable
 * - Derives comparison deltas with trend analysis
 * - Stale-while-revalidate pattern for better UX
 *
 * @param currentSprintId ID of the current sprint to compare
 * @param previousSprintId ID of the previous sprint to compare against (optional)
 * @param options Configuration options for polling and behavior
 * @returns Comparison result with current, previous, and delta metrics
 */
export function useSprintComparison(
  currentSprintId: string,
  previousSprintId: string | null = null,
  options: UseSprintComparisonOptions = {}
): UseSprintComparisonReturn {
  const {
    enabled = true,
    refetchInterval = 30 * 1000, // 30 seconds
  } = options

  const queries = useQueries({
    queries: [
      {
        queryKey: ['sprints', currentSprintId, 'metrics'],
        queryFn: async () => {
          const response = await fetch(`/api/sprints/${currentSprintId}/metrics`)
          if (!response.ok) {
            throw new Error(`Failed to fetch current sprint metrics: ${response.statusText}`)
          }
          return (await response.json()) as SprintHealthData
        },
        enabled: enabled && !!currentSprintId,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      {
        queryKey: ['sprints', previousSprintId, 'metrics'],
        queryFn: async () => {
          if (!previousSprintId) {
            return null
          }
          const response = await fetch(`/api/sprints/${previousSprintId}/metrics`)
          if (!response.ok) {
            // Gracefully handle missing previous sprint data
            return null
          }
          return (await response.json()) as SprintHealthData
        },
        enabled: enabled && !!previousSprintId,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1, // Less aggressive retry for optional previous sprint
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    ],
  })

  const currentQuery = queries[0]
  const previousQuery = queries[1]

  // Extract metrics from responses
  const currentMetrics = extractMetrics(currentQuery.data ?? null)
  const previousMetrics = extractMetrics(previousQuery.data ?? null)

  // Determine overall loading state
  // Consider loading if current is fetching (always required)
  // Previous being fetched is OK (we can show partial data)
  const isLoading = currentQuery.isLoading

  // Determine error state - only if current sprint fails
  const isError = currentQuery.isError
  const error = currentQuery.error

  // Build comparison result
  const data: SprintComparisonResult | null = currentMetrics
    ? {
        currentSprintId,
        previousSprintId: previousSprintId ?? null,
        current: currentMetrics,
        previous: previousMetrics,
        deltas: compareMetrics(currentMetrics, previousMetrics),
      }
    : null

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error : null,
    refetch: async () => {
      const results = await Promise.all([currentQuery.refetch(), previousQuery.refetch()])
      return results
    },
  }
}
