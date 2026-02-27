import { useQuery } from '@tanstack/react-query'
import { Agent } from '../types/domain'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      return response.json() as Promise<Agent[]>
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // 15 seconds
  })
}
