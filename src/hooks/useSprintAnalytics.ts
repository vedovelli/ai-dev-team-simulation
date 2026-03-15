import { useQuery } from '@tanstack/react-query'
import type { SprintAnalyticsData } from '../types/sprint'

/**
 * Options for configuring the useSprintAnalytics hook
 */
export interface UseSprintAnalyticsOptions {
  /** Number of past sprints to include in analysis (default: 5, max: 12) */
  range?: number
  /** Specific metrics to fetch (optional, fetches all if not specified) */
  metrics?: ('velocity' | 'burndown' | 'capacity' | 'forecast')[]
  /** Enable/disable auto-refetch (default: true) */
  enabled?: boolean
  /** Refetch interval in milliseconds (default: 1 hour = 3600000ms) */
  refetchInterval?: number
}

/**
 * Return type for useSprintAnalytics hook
 */
export interface UseSprintAnalyticsReturn {
  data: SprintAnalyticsData | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  isFetching: boolean
  refetch: () => void
}

/**
 * Fetch and calculate sprint analytics with historical metrics
 *
 * Provides:
 * - Velocity trends across last N sprints
 * - Capacity utilization patterns
 * - Burndown analysis and patterns
 * - Forecast accuracy comparison
 * - Summary statistics for planning
 *
 * Features:
 * - 1 hour stale time (historical data is stable)
 * - 24 hour garbage collection time
 * - Exponential backoff retry (3 attempts)
 * - Configurable range of historical sprints
 * - Query deduplication
 *
 * Usage:
 * ```typescript
 * const { data, isLoading } = useSprintAnalytics('sprint-5', {
 *   range: 5,
 *   metrics: ['velocity', 'capacity']
 * })
 *
 * if (isLoading) return <div>Loading analytics...</div>
 *
 * return (
 *   <div>
 *     <p>Average Velocity: {data?.summary.averageVelocity}</p>
 *     <p>Forecast Accuracy: {data?.summary.forecastAccuracyRate}%</p>
 *   </div>
 * )
 * ```
 */
export function useSprintAnalytics(
  sprintId: string,
  options: UseSprintAnalyticsOptions = {},
): UseSprintAnalyticsReturn {
  const {
    range = 5,
    metrics,
    enabled = true,
    refetchInterval = 60 * 60 * 1000, // 1 hour
  } = options

  // Normalize metrics array for query key consistency
  const normalizedMetrics = metrics ? [...metrics].sort() : undefined

  // Build query URL with parameters
  const buildQueryUrl = () => {
    const params = new URLSearchParams()
    params.append('range', String(Math.min(12, Math.max(1, range))))
    if (metrics && metrics.length > 0) {
      params.append('metrics', metrics.join(','))
    }
    return `/api/sprints/${sprintId}/analytics?${params.toString()}`
  }

  const query = useQuery<SprintAnalyticsData, Error>({
    queryKey: [
      'sprints',
      sprintId,
      'analytics',
      { range, metrics: normalizedMetrics },
    ],
    queryFn: async () => {
      const response = await fetch(buildQueryUrl())
      if (!response.ok) {
        throw new Error(
          `Failed to fetch sprint analytics: ${response.statusText}`,
        )
      }
      return response.json() as Promise<SprintAnalyticsData>
    },
    enabled: enabled && !!sprintId,
    staleTime: 60 * 60 * 1000, // 1 hour - historical data is stable
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (was cacheTime in v4)
    refetchInterval: enabled ? refetchInterval : false, // Allow polling when needed
    refetchOnWindowFocus: true, // Refetch on window focus
    refetchOnReconnect: true, // Refetch on connection restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}
