import { useQuery } from '@tanstack/react-query'
import type { AgentAnalyticsResponse } from '../types/agent-analytics'

/**
 * Agent Health & Workload Analytics Hook (FAB-345)
 *
 * Aggregates agent capacity and performance metrics for workload visualization.
 * Supports both single agent and team overview modes.
 *
 * Features:
 * - Single agent analytics when agentId is provided
 * - Team overview when agentId is undefined
 * - 1 minute stale-while-revalidate
 * - 10 minute garbage collection
 * - Exponential backoff retry with 3 attempts
 *
 * Query key: ['agents', agentId || 'team', 'analytics']
 *
 * @param agentId - Optional agent ID for single agent view. If undefined, fetches team analytics.
 * @returns Query result with agent(s) analytics data
 *
 * @example
 * // Team overview
 * const { data, isLoading } = useAgentHealthAnalytics()
 *
 * @example
 * // Single agent
 * const { data, isLoading } = useAgentHealthAnalytics('agent-123')
 */
export function useAgentHealthAnalytics(agentId?: string) {
  const queryKey = ['agents', agentId || 'team', 'analytics']

  return useQuery<AgentAnalyticsResponse>({
    queryKey,
    queryFn: async () => {
      const endpoint = agentId
        ? `/api/agents/${agentId}/health-analytics`
        : '/api/agents/team/health-analytics'

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch agent analytics: ${response.statusText}`
        )
      }

      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    enabled: true,
  })
}
