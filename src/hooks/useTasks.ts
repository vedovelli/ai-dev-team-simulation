import { useQuery } from '@tanstack/react-query'
import type { Task, TaskStatus } from '../types/task'

export function useTasks(status?: TaskStatus) {
  return useQuery<Task[], Error>({
    queryKey: ['tasks', status],
    queryFn: async () => {
      const url = new URL('/api/tasks', window.location.origin)
      if (status) {
        url.searchParams.set('status', status)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      return response.json() as Promise<Task[]>
    },
  })
}
