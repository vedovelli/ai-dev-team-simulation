import { useQuery } from '@tanstack/react-query'
import type { Agent } from '../types/agent'

export interface AgentWithCapacity extends Agent {
  currentTaskCount: number
  maxCapacity: number
  availableSlots: number
}

export function useAgentCapacity() {
  return useQuery({
    queryKey: ['agents', 'capacity'],
    queryFn: async () => {
      const response = await fetch('/api/agents')

      if (!response.ok) {
        throw new Error('Failed to fetch agent capacity')
      }

      return response.json() as Promise<AgentWithCapacity[]>
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Check if an agent can accept the specified number of tasks
 */
export function canAgentAcceptTasks(agent: AgentWithCapacity, taskCount: number): boolean {
  return agent.availableSlots >= taskCount
}
