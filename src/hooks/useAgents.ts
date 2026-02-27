import { useQuery } from '@tanstack/react-query'
import type { Agent } from '../types/agent'

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
  })
}
