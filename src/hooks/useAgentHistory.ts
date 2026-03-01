import { useQuery } from '@tanstack/react-query'
import type { AgentDetailResponse } from '../types/agentHistory'

export function useAgentHistory(agentId: string) {
  return useQuery<AgentDetailResponse, Error>({
    queryKey: ['agentHistory', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/history`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent history')
      }
      return response.json()
    },
    enabled: !!agentId,
  })
}
