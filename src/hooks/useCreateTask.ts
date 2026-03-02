import { useQueryClient } from '@tanstack/react-query'
import type { CreateTaskInput } from '../types/taskValidation'
import type { Task } from '../types/task'
import { useMutationWithRetry } from './useMutationWithRetry'

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: CreateTaskInput): Promise<Task> => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      return response.json()
    },
    onMutate: async (data) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous tasks data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Create optimistic task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: data.name,
        assignee: 'Unassigned',
        team: data.team || 'general',
        status: data.status || 'backlog',
        priority: data.priority || 'medium',
        storyPoints: 0,
        sprint: data.sprint || 'sprint-1',
        order: 0,
        estimatedHours: data.estimatedHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependsOn: [],
      }

      // Optimistically add the new task to the cache
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: Task[] = []) => [
          ...oldData,
          optimisticTask,
        ])
      })

      return { previousTasks, optimisticTask }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: (newTask, _, context) => {
      // Replace optimistic task with real task
      if (context?.optimisticTask) {
        queryClient.setQueryData(['tasks'], (oldData: Task[] = []) =>
          oldData.map((task) =>
            task.id === context.optimisticTask.id ? newTask : task
          )
        )
      }
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
