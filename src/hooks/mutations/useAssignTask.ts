import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import type { TaskAssignmentInput } from '../../types/forms/taskAssignment'
import { useMutationWithRetry } from '../useMutationWithRetry'

interface AssignTaskPayload {
  taskId: string
  data: TaskAssignmentInput
}

export function useAssignTask() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({ taskId, data }: AssignTaskPayload) => {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign task. Agent may be at capacity.')
      }

      return response.json() as Promise<Task>
    },
    onMutate: async ({ taskId, data }) => {
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

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  assignee: data.agent,
                  priority:
                    data.priority === 1
                      ? 'high'
                      : data.priority === 2
                        ? 'medium'
                        : 'low',
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
    onSuccess: (_, { taskId }) => {
      // Invalidate sprint tasks query to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sprints'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
