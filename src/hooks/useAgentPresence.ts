import { useQuery } from '@tanstack/react-query'
import type { AgentPresence } from '../types/agent'

/**
 * Options for controlling polling behavior
 */
export interface UseAgentPresenceOptions {
  /** Refetch interval in milliseconds (default: 5000 = 5s) */
  refetchInterval?: number
  /** Enable automatic refetch (default: true) */
  refetchOnWindowFocus?: boolean
  /** Refetch in background when window is not focused (default: true) */
  refetchIntervalInBackground?: boolean
}

/**
 * Fetch real-time presence status for all agents
 *
 * Features:
 * - Automatic polling every 5 seconds (configurable)
 * - Refetch on window focus and reconnect
 * - Stale-while-revalidate strategy
 * - Auto-detects online/offline status
 * - Proper error handling and retry logic
 *
 * Query key structure: ['agent-presence']
 *
 * @param options Configuration for polling behavior
 * @returns Query result with agent presence data
 *
 * @example
 * const { data: presenceList, isLoading } = useAgentPresence()
 * presenceList.forEach(presence => {
 *   console.log(`${presence.name}: ${presence.presence}`)
 * })
 */
export function useAgentPresence(options: UseAgentPresenceOptions = {}) {
  const {
    refetchInterval = 5 * 1000, // 5 seconds for real-time updates
    refetchOnWindowFocus = true,
    refetchIntervalInBackground = true,
  } = options

  return useQuery({
    queryKey: ['agent-presence'],
    queryFn: async () => {
      const response = await fetch('/api/agent-presence')
      if (!response.ok) {
        throw new Error(`Failed to fetch agent presence: ${response.statusText}`)
      }

      const data = await response.json() as { presence: AgentPresence[] }
      return data.presence
    },
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchInterval, // Polling configuration for real-time updates
    refetchIntervalInBackground, // Continue polling even when window is not focused
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 2, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  })
}

/**
 * Get presence status for a specific agent
 *
 * @param agentId Agent ID to fetch presence for
 * @returns Presence status or undefined if not available
 *
 * @example
 * const { data: presenceList } = useAgentPresence()
 * const agentPresence = presenceList?.find(p => p.id === agentId)
 */
export function useAgentPresenceById(
  agentId: string,
  options: UseAgentPresenceOptions = {}
) {
  const { data: presenceList } = useAgentPresence(options)
  return presenceList?.find((p) => p.id === agentId)
}
