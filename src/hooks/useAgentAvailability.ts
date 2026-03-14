import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AgentAvailabilityStatus } from '../types/agent'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Agent availability status information
 */
export interface AgentAvailabilityInfo {
  id: string
  name: string
  status: AgentAvailabilityStatus
  lastSeen: string
  currentTaskCount: number
}

/**
 * Response from GET /api/agents/status
 */
interface AgentStatusResponse {
  agents: AgentAvailabilityInfo[]
}

/**
 * Configuration options for useAgentAvailability hook
 */
export interface UseAgentAvailabilityOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Fetch real-time agent availability status with polling
 *
 * Features:
 * - Automatic polling every 30 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy: 30s stale, 5min gc
 * - Manual status toggle mutation for testing/demo
 * - Exponential backoff retry logic
 * - Full TypeScript type safety
 */
export function useAgentAvailability(options: UseAgentAvailabilityOptions = {}) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
  } = options

  const queryClient = useQueryClient()

  // Query to fetch agent availability status
  const query = useQuery<AgentStatusResponse, Error>({
    queryKey: ['agents', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/agents/status', {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agent availability: ${response.statusText}`)
      }

      return response.json() as Promise<AgentStatusResponse>
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchInterval,
    refetchOnWindowFocus: refetchOnWindowFocus ? 'stale' : false,
    refetchOnReconnect: 'stale',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for manual status toggle
  const toggleStatusMutation = useMutationWithRetry<AgentAvailabilityInfo, { status: AgentAvailabilityStatus }>({
    mutationFn: async ({ status }) => {
      const response = await fetch('/api/agents/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update agent status: ${response.statusText}`)
      }

      return response.json() as Promise<AgentAvailabilityInfo>
    },
    onMutate: async ({ status }) => {
      // Cancel any pending requests
      await queryClient.cancelQueries({ queryKey: ['agents', 'status'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<AgentStatusResponse>({
        queryKey: ['agents', 'status'],
      })

      // Optimistically update the first agent (current user)
      if (previousData && previousData.agents.length > 0) {
        const updated = {
          ...previousData,
          agents: previousData.agents.map((agent, index) =>
            index === 0 ? { ...agent, status } : agent
          ),
        }
        queryClient.setQueryData(['agents', 'status'], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['agents', 'status'], context.previousData)
      }
    },
    onSuccess: () => {
      // Refetch to get latest data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['agents', 'status'] })
    },
  })

  /**
   * Toggle current user's availability status
   */
  const toggleStatus = (status: AgentAvailabilityStatus) => {
    toggleStatusMutation.mutate({ status })
  }

  /**
   * Get agent by ID
   */
  const getAgent = (agentId: string): AgentAvailabilityInfo | undefined => {
    return query.data?.agents.find((agent) => agent.id === agentId)
  }

  /**
   * Get all agents with a specific status
   */
  const getAgentsByStatus = (status: AgentAvailabilityStatus): AgentAvailabilityInfo[] => {
    return query.data?.agents.filter((agent) => agent.status === status) ?? []
  }

  /**
   * Check if agent is available (online or busy)
   */
  const isAvailable = (agentId: string): boolean => {
    const agent = getAgent(agentId)
    return agent ? agent.status !== 'offline' : false
  }

  return {
    // Query state
    ...query,

    // Computed values
    agents: query.data?.agents ?? [],

    // Mutation state
    toggleStatusLoading: toggleStatusMutation.isLoading,
    toggleStatusError: toggleStatusMutation.error,

    // Actions
    toggleStatus,
    getAgent,
    getAgentsByStatus,
    isAvailable,
  }
}

export type UseAgentAvailabilityReturn = ReturnType<typeof useAgentAvailability>
