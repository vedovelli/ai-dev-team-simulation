import { useQuery } from '@tanstack/react-query'
import type { SprintTask } from '../types/sprint'

export function useSprintTasks(sprintId: string | undefined) {
  return useQuery<SprintTask[], Error>({
    queryKey: ['sprints', sprintId, 'tasks'],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/tasks`)
      if (!response.ok) {
        throw new Error('Failed to fetch sprint tasks')
      }
      return response.json()
    },
    enabled: !!sprintId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
