import { useQuery } from '@tanstack/react-query'
import type { Sprint } from '../types/sprint'

export function useSprintsList() {
  return useQuery<Sprint[], Error>({
    queryKey: ['sprints'],
    queryFn: async () => {
      const response = await fetch('/api/sprints')
      if (!response.ok) {
        throw new Error('Failed to fetch sprints')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
