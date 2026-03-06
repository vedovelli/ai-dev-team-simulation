/**
 * Agent Performance Metrics Hook
 *
 * Coordinates multiple TanStack Query endpoints to fetch comprehensive
 * performance metrics data. Handles loading/error states gracefully and
 * provides typed responses.
 *
 * @example
 * ```tsx
 * const { summary, timeSeriesData, agentMetrics, isLoading, error } = useMetrics()
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import type {
  PerformanceSummary,
  TimeSeriesDataPoint,
  AgentMetrics,
} from '../types/metrics'

interface UseMetricsResult {
  summary: PerformanceSummary | undefined
  timeSeriesData: TimeSeriesDataPoint[] | undefined
  agentMetrics: AgentMetrics[] | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook for fetching and coordinating agent performance metrics
 *
 * Fetches three separate endpoints and coordinates their loading/error states:
 * - GET /api/metrics/summary - aggregated performance stats
 * - GET /api/metrics/timeseries - time-series data for charts
 * - GET /api/agents/performance - per-agent performance breakdown
 *
 * Cache configuration:
 * - staleTime: 30 seconds - data is considered fresh for 30 seconds
 * - gcTime: 5 minutes - cached data persists for 5 minutes before garbage collection
 *
 * @returns Object containing metrics data and query state
 */
export function useMetrics(): UseMetricsResult {
  // Fetch performance summary
  const summaryQuery = useQuery<PerformanceSummary, Error>({
    queryKey: ['metrics', 'summary'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/summary')
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics summary: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch time-series data
  const timeSeriesQuery = useQuery<TimeSeriesDataPoint[], Error>({
    queryKey: ['metrics', 'timeseries'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/timeseries')
      if (!response.ok) {
        throw new Error(`Failed to fetch time-series data: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch agent performance data
  const agentPerformanceQuery = useQuery<AgentMetrics[], Error>({
    queryKey: ['agents', 'performance'],
    queryFn: async () => {
      const response = await fetch('/api/agents/performance')
      if (!response.ok) {
        throw new Error(`Failed to fetch agent performance: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Determine overall loading state (loading if any query is loading)
  const isLoading =
    summaryQuery.isLoading ||
    timeSeriesQuery.isLoading ||
    agentPerformanceQuery.isLoading

  // Determine overall error state (error if any query has an error)
  const isError =
    summaryQuery.isError ||
    timeSeriesQuery.isError ||
    agentPerformanceQuery.isError

  // Get first error encountered
  const error =
    summaryQuery.error ||
    timeSeriesQuery.error ||
    agentPerformanceQuery.error ||
    null

  // Combined refetch function
  const refetch = () => {
    summaryQuery.refetch()
    timeSeriesQuery.refetch()
    agentPerformanceQuery.refetch()
  }

  return {
    summary: summaryQuery.data,
    timeSeriesData: timeSeriesQuery.data,
    agentMetrics: agentPerformanceQuery.data,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Cache Invalidation Pattern
 *
 * To invalidate metrics after mutations, use TanStack Query's invalidateQueries:
 *
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all metrics queries
 * queryClient.invalidateQueries({ queryKey: ['metrics'] })
 *
 * // Invalidate all agent performance queries
 * queryClient.invalidateQueries({ queryKey: ['agents', 'performance'] })
 *
 * // Invalidate specific metric endpoint
 * queryClient.invalidateQueries({ queryKey: ['metrics', 'summary'] })
 * ```
 *
 * Common use cases:
 * - After task completion/failure
 * - After agent status change
 * - After task assignment changes
 * - On manual refresh
 */
