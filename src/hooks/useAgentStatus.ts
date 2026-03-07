import { useQuery } from '@tanstack/react-query'
import type { AgentAvailability } from '../types/agent'

/**
 * Fetch and monitor agent real-time availability status
 *
 * Features:
 * - Automatic polling every 10 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy for better UX
 * - Includes error handling and retry logic with exponential backoff
 */
export interface UseAgentStatusOptions {
  /** Refetch interval in milliseconds (default: 10000 = 10s) */
  refetchInterval?: number
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

export function useAgentStatus(agentId: string, options: UseAgentStatusOptions = {}) {
  const {
    refetchInterval = 10 * 1000, // 10 seconds
    refetchOnWindowFocus = true,
  } = options

  const query = useQuery<AgentAvailability, Error>({
    queryKey: ['agents', agentId, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/status`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.statusText}`)
      }
      return response.json() as Promise<AgentAvailability>
    },
    enabled: !!agentId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchInterval, // Polling configuration
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  return query
}
