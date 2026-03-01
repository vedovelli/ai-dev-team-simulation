import { useQuery } from '@tanstack/react-query'
import type { Task, TaskStatus, TaskPriority } from '../types/task'

interface TasksResponse {
  data: Task[]
  total: number
  pageIndex: number
  pageSize: number
}

export interface TaskQueryParams {
  status?: TaskStatus | null
  priority?: TaskPriority | null
  search?: string
  team?: string
  sprint?: string
  assignee?: string
}

export function useTasks(params?: TaskQueryParams) {
  const queryKey = ['tasks', params]

  return useQuery<Task[]>({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/tasks', window.location.origin)

      if (params) {
        if (params.status) {
          url.searchParams.set('status', params.status)
        }
        if (params.priority) {
          url.searchParams.set('priority', params.priority)
        }
        if (params.search) {
          url.searchParams.set('search', params.search)
        }
        if (params.team) {
          url.searchParams.set('team', params.team)
        }
        if (params.sprint) {
          url.searchParams.set('sprint', params.sprint)
        }
        if (params.assignee) {
          url.searchParams.set('assignee', params.assignee)
        }
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const result = (await response.json()) as TasksResponse
      return result.data
    },
  })
}
