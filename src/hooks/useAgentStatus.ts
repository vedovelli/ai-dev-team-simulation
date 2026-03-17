import { useQuery, useQueries } from '@tanstack/react-query'
import type { AgentStatusResponse } from '../types/agent'

/**
 * Options for useAgentStatus hook
 */
export interface UseAgentStatusOptions {
  /** Polling interval in milliseconds (default: 15000 = 15s) */
  pollInterval?: number
  /** Enable refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Return type for useAgentStatus hook
 */
export interface UseAgentStatusReturn {
  data: AgentStatusResponse | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Return type for useAgentStatusList hook
 */
export interface UseAgentStatusListReturn {
  statuses: AgentStatusResponse[]
  isAnyLoading: boolean
  isAnyError: boolean
  refetch: () => void
}

/**
 * Fetch live status for a single agent
 *
 * Polls every 15 seconds (configurable) to show:
 * - Current availability: 'available' | 'busy' | 'offline'
 * - Current task count and capacity
 * - Last update timestamp
 *
 * Query key: ['agents', agentId, 'status']
 *
 * Features:
 * - Polling every 15 seconds (configurable)
 * - Stale time: 10s
 * - GC time: 2 minutes
 * - Exponential backoff retry (3 attempts)
 * - Refetch on window focus
 */
export function useAgentStatus(agentId: string, options: UseAgentStatusOptions = {}): UseAgentStatusReturn {
  const { pollInterval = 15 * 1000, refetchOnWindowFocus = true } = options

  const query = useQuery({
    queryKey: ['agents', agentId, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/status`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.statusText}`)
      }
      return response.json() as Promise<AgentStatusResponse>
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: pollInterval,
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  }
}

/**
 * Fetch live status for multiple agents in parallel
 *
 * Uses useQueries to fetch multiple agents in parallel with the same config.
 * Returns aggregated results for convenience.
 *
 * Features:
 * - Fetches multiple agents in parallel
 * - Same polling, retry, and stale time config as useAgentStatus
 * - Aggregates loading and error states
 */
export function useAgentStatusList(
  agentIds: string[],
  options: UseAgentStatusOptions = {}
): UseAgentStatusListReturn {
  const { pollInterval = 15 * 1000, refetchOnWindowFocus = true } = options

  const queries = useQueries({
    queries: agentIds.map((agentId) => ({
      queryKey: ['agents', agentId, 'status'],
      queryFn: async () => {
        const response = await fetch(`/api/agents/${agentId}/status`)
        if (!response.ok) {
          throw new Error(`Failed to fetch agent status: ${response.statusText}`)
        }
        return response.json() as Promise<AgentStatusResponse>
      },
      staleTime: 10 * 1000, // 10 seconds
      gcTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: pollInterval,
      refetchOnWindowFocus,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })),
  })

  const statuses = queries.map((q) => q.data).filter((data): data is AgentStatusResponse => data !== undefined)
  const isAnyLoading = queries.some((q) => q.isLoading)
  const isAnyError = queries.some((q) => q.isError)

  return {
    statuses,
    isAnyLoading,
    isAnyError,
    refetch: () => queries.forEach((q) => q.refetch()),
  }
}
