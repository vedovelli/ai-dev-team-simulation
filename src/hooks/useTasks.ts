import { useQuery } from '@tanstack/react-query'
import type { Task } from '../mocks/handlers'

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const json = await response.json()
      return json.data as Task[]
    },
  })
}
