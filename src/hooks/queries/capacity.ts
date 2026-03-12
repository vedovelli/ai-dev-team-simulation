import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { AgentCapacityMetricsResponse } from '../../types/capacity'

/**
 * Query keys factory for agent capacity queries
 */
export const capacityKeys = {
  all: ['agents', 'capacity'] as const,
  bySprintId: (sprintId: string) =>
    [...capacityKeys.all, sprintId] as const,
}

interface UseAgentCapacityMetricsOptions
  extends Omit<UseQueryOptions, 'queryKey' | 'queryFn'> {
  pollingInterval?: number // Default: 20000ms (20 seconds)
}

/**
 * Fetch agent capacity metrics for a sprint
 *
 * Features:
 * - TanStack Query with 20s polling interval (configurable)
 * - Stale-while-revalidate strategy with 30s stale time
 * - Query key: ['agents', 'capacity', sprintId]
 * - Exponential backoff retry (3 attempts)
 * - Returns per-agent metrics with warning levels
 *
 * @param sprintId - The sprint ID to fetch capacity for
 * @param options - Optional query configuration (pollingInterval, etc)
 * @returns Agents with capacity metrics including utilization and warning levels
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAgentCapacityMetrics(sprintId)
 * if (data) {
 *   data.agents.forEach(agent => {
 *     console.log(`${agent.name}: ${agent.utilizationPct}% (${agent.warningLevel})`)
 *   })
 * }
 * ```
 */
export function useAgentCapacityMetrics(
  sprintId: string | null | undefined,
  options?: UseAgentCapacityMetricsOptions
) {
  const pollingInterval = options?.pollingInterval ?? 20000 // 20 seconds default

  return useQuery<AgentCapacityMetricsResponse>({
    queryKey: sprintId ? capacityKeys.bySprintId(sprintId) : [],
    queryFn: async () => {
      const response = await fetch(
        `/api/agents/capacity?sprintId=${sprintId}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch agent capacity metrics')
      }
      return response.json()
    },
    staleTime: 1000 * 30, // 30 seconds (stale-while-revalidate)
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: sprintId ? pollingInterval : false,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000, // Exponential backoff
    enabled: !!sprintId, // Dependent query
    ...options,
  })
}
