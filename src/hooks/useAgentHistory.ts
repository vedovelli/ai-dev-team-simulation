import { useQuery } from '@tanstack/react-query'
import type { AgentHistoryEntry } from '../types/agent'

export function useAgentHistory(agentId: string) {
  return useQuery({
    queryKey: ['agentHistory', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/history`)
      return response.json() as Promise<AgentHistoryEntry[]>
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })
}
