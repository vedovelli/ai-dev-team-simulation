import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Task, TaskState } from '../types/domain'

export interface TaskFilter {
  state?: TaskState
  sprintId?: string
  assignedTo?: string
}

export function useTasks(filter?: TaskFilter) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter?.state) params.append('state', filter.state)
      if (filter?.sprintId) params.append('sprintId', filter.sprintId)
      if (filter?.assignedTo) params.append('assignedTo', filter.assignedTo)

      const queryString = params.toString()
      const url = `/api/tasks${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      return response.json() as Promise<Task[]>
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // 15 seconds
  })

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to complete task')
      }
      return response.json() as Promise<Task>
    },
    onSuccess: (completedTask) => {
      // Invalidate the tasks query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      // Update the specific task in cache
      queryClient.setQueryData(
        ['tasks', filter],
        (oldTasks: Task[] | undefined) => {
          if (!oldTasks) return oldTasks
          return oldTasks.map(t => (t.id === completedTask.id ? completedTask : t))
        },
      )
    },
  })

  return {
    ...query,
    completeTask: completeTaskMutation.mutate,
    isCompletingTask: completeTaskMutation.isPending,
  }
}
