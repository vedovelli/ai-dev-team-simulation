import { useQuery } from '@tanstack/react-query'
import type { AgentCalendarAvailability } from '../types/agent'
import { useAgents } from './useAgents'

/**
 * Fetch agent availability for a specific month
 * Returns daily availability status, task counts, and conflict information
 */
export function useAgentAvailability(agentId: string, month: number, year: number) {
  const { data: agents = [] } = useAgents()
  const agent = agents.find((a) => a.id === agentId)

  return useQuery({
    queryKey: ['agents', agentId, 'availability', year, month],
    queryFn: async () => {
      const response = await fetch(
        `/api/agents/${agentId}/availability?month=${month}&year=${year}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch agent availability')
      }

      return response.json() as Promise<AgentCalendarAvailability>
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!agentId,
  })
}

/**
 * Hook to get all agents for selection
 */
export function useAvailableAgents() {
  return useAgents()
}
