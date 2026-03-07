import { useQuery } from '@tanstack/react-query'
import type { AgentManagement, AgentStats } from '../../types/agent'

/**
 * Response type for single agent endpoint
 * Includes agent details plus task statistics
 */
interface AgentDetailResponse {
  stats: AgentStats
} & AgentManagement

/**
 * Fetch single agent details with task statistics
 *
 * Features:
 * - Real-time stats for current/completed tasks and success rate
 * - Enabled only when agentId is provided
 * - Stale-while-revalidate strategy
 * - Exponential backoff retry on failure
 *
 * Query key structure: ['agents', agentId]
 */
export function useAgent(agentId?: string) {
  return useQuery<AgentDetailResponse, Error>({
    queryKey: ['agents', agentId],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID is required')

      const response = await fetch(`/api/agents/${agentId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agent: ${response.statusText}`)
      }

      return response.json() as Promise<AgentDetailResponse>
    },
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
