import { useQuery } from '@tanstack/react-query'
import type { SprintHealthData } from '../types/sprint'

export function useSprintMetrics(sprintId: string) {
  return useQuery<SprintHealthData, Error>({
    queryKey: ['sprintMetrics', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/metrics`)
      if (!response.ok) {
        throw new Error('Failed to fetch sprint metrics')
      }
      return response.json()
    },
    enabled: !!sprintId,
  })
}
