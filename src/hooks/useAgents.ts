import { useQuery } from '@tanstack/react-query'
import type { Agent } from '../types/agent'

interface UseAgentsOptions {
  pollingInterval?: number
}

export function useAgents(options?: UseAgentsOptions) {
  const pollingInterval = options?.pollingInterval ?? 5000 // Default 5 seconds

  return useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      return response.json()
    },
    refetchInterval: pollingInterval,
  })
}
