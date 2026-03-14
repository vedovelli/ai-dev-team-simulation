/**
 * useAgentCapacityMetricsV1 Hook
 *
 * Simplified hook for fetching agent capacity metrics for management dashboard.
 * Provides agent workload data with capacity visualization.
 *
 * Features:
 * - TanStack Query with 60s polling (management-focused, lower frequency)
 * - Stale-while-revalidate strategy with 60s stale time
 * - Exponential backoff retry (3 attempts)
 * - Automatic refetch on window focus
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { AgentCapacityMetricsV1Response } from '../mocks/handlers/agent-capacity-v1'

/**
 * Query key factory for agent capacity v1 queries
 */
export const capacityV1Keys = {
  all: ['agents', 'capacity', 'v1'] as const,
  metrics: () => [...capacityV1Keys.all, 'metrics'] as const,
}

interface UseAgentCapacityMetricsV1Options
  extends Omit<UseQueryOptions, 'queryKey' | 'queryFn'> {
  pollingInterval?: number // Default: 60000ms (60 seconds)
}

/**
 * Fetch agent capacity metrics for management dashboard
 *
 * Features:
 * - 60s polling interval (management-focused, not real-time)
 * - Stale-while-revalidate strategy with 60s stale time
 * - Exponential backoff retry (3 attempts)
 * - Automatic refetch on window focus
 * - Query key: ['agents', 'capacity', 'v1', 'metrics']
 *
 * @param options - Optional query configuration (pollingInterval, etc)
 * @returns Agent metrics with capacity percentages
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAgentCapacityMetricsV1()
 * if (data) {
 *   data.agents.forEach(agent => {
 *     console.log(`${agent.name}: ${agent.utilizationPct}%`)
 *   })
 * }
 * ```
 */
export function useAgentCapacityMetricsV1(
  options?: UseAgentCapacityMetricsV1Options
) {
  const pollingInterval = options?.pollingInterval ?? 60000 // 60 seconds default

  return useQuery<AgentCapacityMetricsV1Response>({
    queryKey: capacityV1Keys.metrics(),
    queryFn: async () => {
      const response = await fetch('/api/agents/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch agent capacity metrics')
      }
      return response.json()
    },
    staleTime: 1000 * 60, // 60 seconds (stale-while-revalidate)
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000, // Exponential backoff
    ...options,
  })
}
