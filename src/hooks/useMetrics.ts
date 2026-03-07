/**
 * Agent Performance Metrics Hook
 *
 * Uses useQueries to parallelize metric endpoint fetching for optimal performance.
 * Supports suspense boundaries for progressive loading of dashboard sections.
 *
 * @example
 * ```tsx
 * const { summary, timeSeriesData, agentMetrics, isLoading, error } = useMetrics()
 * ```
 */

import { useQueries, useQueryClient } from '@tanstack/react-query'
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
  refetch: () => Promise<void>
}

const METRICS_CACHE_CONFIG = {
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes
}

/**
 * Hook for fetching agent performance metrics in parallel
 *
 * Uses TanStack Query's useQueries to fetch three endpoints simultaneously:
 * - GET /api/metrics/summary - aggregated performance stats
 * - GET /api/metrics/timeseries - time-series data for charts
 * - GET /api/agents/performance - per-agent performance breakdown
 *
 * Supports suspense for progressive loading with boundaries.
 *
 * @returns Object containing metrics data and query state
 */
export function useMetrics(): UseMetricsResult {
  const queryClient = useQueryClient()

  const queries = useQueries({
    queries: [
      {
        queryKey: ['metrics', 'summary'],
        queryFn: async () => {
          const response = await fetch('/api/metrics/summary')
          if (!response.ok) {
            throw new Error(`Failed to fetch metrics summary: ${response.status}`)
          }
          return response.json() as Promise<PerformanceSummary>
        },
        ...METRICS_CACHE_CONFIG,
      },
      {
        queryKey: ['metrics', 'timeseries'],
        queryFn: async () => {
          const response = await fetch('/api/metrics/timeseries')
          if (!response.ok) {
            throw new Error(`Failed to fetch time-series data: ${response.status}`)
          }
          return response.json() as Promise<TimeSeriesDataPoint[]>
        },
        ...METRICS_CACHE_CONFIG,
      },
      {
        queryKey: ['agents', 'performance'],
        queryFn: async () => {
          const response = await fetch('/api/agents/performance')
          if (!response.ok) {
            throw new Error(`Failed to fetch agent performance: ${response.status}`)
          }
          return response.json() as Promise<AgentMetrics[]>
        },
        ...METRICS_CACHE_CONFIG,
      },
    ],
  })

  const [summaryQuery, timeSeriesQuery, agentPerformanceQuery] = queries

  // Determine overall loading state
  const isLoading = queries.some((query) => query.isLoading)

  // Determine overall error state
  const isError = queries.some((query) => query.isError)

  // Get first error encountered
  const error =
    queries.find((query) => query.error)?.error || null

  // Combined refetch function that waits for all queries
  const refetch = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      timeSeriesQuery.refetch(),
      agentPerformanceQuery.refetch(),
    ])
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
 * Cache Invalidation Pattern for Real-Time Updates
 *
 * Use TanStack Query's invalidateQueries to refresh metrics after mutations
 * or external data changes (e.g., WebSocket updates).
 *
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all metrics queries (summary + timeseries)
 * queryClient.invalidateQueries({ queryKey: ['metrics'] })
 *
 * // Invalidate all agent performance queries
 * queryClient.invalidateQueries({ queryKey: ['agents', 'performance'] })
 *
 * // Invalidate specific metric endpoint
 * queryClient.invalidateQueries({ queryKey: ['metrics', 'summary'] })
 *
 * // Real-time WebSocket example
 * useEffect(() => {
 *   const socket = io('/metrics')
 *   socket.on('update', (event) => {
 *     // Refetch metrics when WebSocket sends updates
 *     if (event.type === 'agent_completed_task') {
 *       queryClient.invalidateQueries({ queryKey: ['agents', 'performance'] })
 *     }
 *   })
 *   return () => socket.close()
 * }, [])
 * ```
 *
 * Common invalidation triggers:
 * - After task completion/failure
 * - After agent status changes
 * - After task assignment/reassignment
 * - On manual refresh/refetch
 * - WebSocket real-time metric updates
 */
