import { useQuery } from '@tanstack/react-query'
import type { AgentAvailability } from '../types/agent'

/**
 * Agent status aggregation showing counts by status type
 */
export interface AgentStatusAggregation {
  idle: number
  working: number
  waiting: number
}

/**
 * Aggregated agent status data with individual agent details
 */
export interface AgentStatusData {
  agents: AgentAvailability[]
  aggregation: AgentStatusAggregation
}

/**
 * Options for useAgentStatus hook
 */
export interface UseAgentStatusOptions {
  /** Refetch interval in milliseconds (default: 15000 = 15s) */
  refetchInterval?: number
  /** Enable automatic refetch (default: true) */
  refetchOnWindowFocus?: boolean
  /** Specific agent ID to fetch status for (optional for single agent queries) */
  agentId?: string
}

/**
 * Fetch all agents with parallel queries
 *
 * Uses parallel queries pattern:
 * - ['agents', 'status'] - All agents' status (primary query key per spec)
 * - Individual agent status fetches in parallel
 *
 * Features:
 * - Auto-refresh every 10 seconds (configurable)
 * - 5s stale time per spec
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy
 * - Status aggregation (idle/working/waiting counts)
 * - Exponential backoff retry on failure
 * - Graceful error handling
 */
export function useAgentStatus(options: UseAgentStatusOptions = {}) {
  const {
    refetchInterval = 10 * 1000, // 10 seconds per spec
    refetchOnWindowFocus = true,
  } = options

  // First query: Get list of all agents
  const agentsListQuery = useQuery({
    queryKey: ['agents', 'list'],
    queryFn: async () => {
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`)
      }
      const data = await response.json()
      // Handle both array and object responses
      return Array.isArray(data) ? data : data.agents || []
    },
    staleTime: 5 * 1000, // 5 seconds per spec
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Second query: Get individual agent status for each agent
  // This runs in parallel with the list query
  const agentStatusesQuery = useQuery({
    queryKey: ['agents', 'status'],
    queryFn: async () => {
      if (!agentsListQuery.data || agentsListQuery.data.length === 0) {
        return []
      }

      // Fetch status for all agents in parallel
      const statusPromises = agentsListQuery.data.map((agent: any) => {
        const agentId = agent.id || agent
        return fetch(`/api/agents/${agentId}/status`)
          .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch status for ${agentId}`)
            return res.json()
          })
          .catch(() => null) // Return null if individual status fetch fails
      })

      const statuses = await Promise.all(statusPromises)
      return statuses.filter((status) => status !== null) as AgentAvailability[]
    },
    enabled: agentsListQuery.isSuccess && (agentsListQuery.data?.length ?? 0) > 0,
    staleTime: 5 * 1000, // 5 seconds per spec
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Compute aggregation from status data
  const aggregation: AgentStatusAggregation = {
    idle: 0,
    working: 0,
    waiting: 0,
  }

  if (agentStatusesQuery.data) {
    agentStatusesQuery.data.forEach((agent) => {
      // Map availability statuses to dashboard statuses
      // 'idle' -> idle, 'active'/'busy' -> working, 'offline' -> waiting
      if (agent.status === 'idle') {
        aggregation.idle++
      } else if (agent.status === 'active' || agent.status === 'busy') {
        aggregation.working++
      } else if (agent.status === 'offline') {
        aggregation.waiting++
      }
    })
  }

  return {
    agents: agentStatusesQuery.data || [],
    aggregation,
    isLoading: agentsListQuery.isLoading || agentStatusesQuery.isLoading,
    isError: agentsListQuery.isError || agentStatusesQuery.isError,
    error: agentsListQuery.error || agentStatusesQuery.error,
  }
}

/**
 * Fetch status for a single agent
 *
 * Query key: ['agents', agentId, 'status']
 */
export function useAgentStatusSingle(agentId: string, options: UseAgentStatusOptions = {}) {
  const {
    refetchInterval = 10 * 1000, // 10 seconds per spec
    refetchOnWindowFocus = true,
  } = options

  return useQuery({
    queryKey: ['agents', agentId, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/status`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.statusText}`)
      }
      return response.json() as Promise<AgentAvailability>
    },
    staleTime: 5 * 1000, // 5 seconds per spec
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
