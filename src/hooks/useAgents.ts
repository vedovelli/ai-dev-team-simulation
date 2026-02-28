import { useQuery } from '@tanstack/react-query'
import type { Agent } from '../types/agent'

interface UseAgentsOptions {
  pollingInterval?: number
  page?: number
  pageSize?: number
}

interface AgentsResponse {
  data: Agent[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function useAgents(options?: UseAgentsOptions) {
  const pollingInterval = options?.pollingInterval ?? 5000 // Default 5 seconds
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 50

  return useQuery<AgentsResponse>({
    queryKey: ['agents', page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      const response = await fetch(`/api/agents?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      return response.json()
    },
    refetchInterval: pollingInterval,
    // TanStack Query automatically clears the refetch interval when the component
    // unmounts or when the hook is no longer active, preventing memory leaks
  })
}
