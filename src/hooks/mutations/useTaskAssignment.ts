import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import type { BatchTaskAssignmentInput } from '../../lib/validation'
import { useMutationWithRetry } from '../useMutationWithRetry'

interface AssignTasksPayload {
  taskIds: string[]
  data: Omit<BatchTaskAssignmentInput, 'taskIds'>
}

export function useTaskAssignment() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({ taskIds, data }: AssignTasksPayload) => {
      const response = await fetch('/api/tasks/assign-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds,
          agentId: data.agentId,
          priority: data.priority,
          estimatedHours: data.estimatedHours,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign tasks. Agent may be at capacity.')
      }

      return response.json() as Promise<Task[]>
    },

    onMutate: async ({ taskIds, data }) => {
      // Cancel any pending requests for tasks and sprints
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      await queryClient.cancelQueries({ queryKey: ['sprints'] })

      // Snapshot the previous data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      const previousSprints = queryClient.getQueriesData({
        queryKey: ['sprints'],
      })

      // Convert priority number to priority string
      const priorityMap: Record<number, 'high' | 'medium' | 'low'> = {
        1: 'high',
        2: 'medium',
        3: 'low',
      }

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            taskIds.includes(task.id)
              ? {
                  ...task,
                  assignee: data.agentId,
                  priority: priorityMap[data.priority] || 'low',
                  estimatedHours: data.estimatedHours,
                  updatedAt: new Date().toISOString(),
                }
              : task
          )
        )
      })

      return { previousTasks, previousSprints }
    },

    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      if (context?.previousSprints) {
        context.previousSprints.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },

    onSuccess: () => {
      // Invalidate both queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
