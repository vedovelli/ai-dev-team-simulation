import { useQuery } from '@tanstack/react-query'
import type { Sprint } from '../types/sprint'

export function useSprintDetail(sprintId: string | undefined) {
  return useQuery<Sprint, Error>({
    queryKey: ['sprints', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch sprint detail')
      }
      return response.json()
    },
    enabled: !!sprintId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
