import { useQueryClient } from '@tanstack/react-query'
import type { CreateTaskInput } from '../types/taskValidation'
import type { Task } from '../types/task'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Create a new task from a template
 *
 * Spreads template default fields into task data and creates the task.
 * Uses optimistic updates for immediate feedback.
 *
 * @returns Mutation object with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useCreateTaskFromTemplate()
 * const handleCreate = (templateFields: any, overrides: Partial<CreateTaskInput>) => {
 *   mutate({ templateFields, overrides }, {
 *     onSuccess: () => console.log('Task created from template')
 *   })
 * }
 */
export const useCreateTaskFromTemplate = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({
      templateFields,
      overrides,
    }: {
      templateFields: any
      overrides: Partial<CreateTaskInput>
    }): Promise<Task> => {
      // Merge template fields with overrides
      const taskData = {
        name: overrides.name || templateFields.title || '',
        status: overrides.status || templateFields.status || 'backlog',
        team: overrides.team || 'general',
        sprint: overrides.sprint || 'sprint-1',
        priority: overrides.priority || templateFields.priority || 'medium',
        estimatedHours:
          overrides.estimatedHours || templateFields.estimatedHours,
        assignedAgent: overrides.assignedAgent || 'Unassigned',
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task from template')
      }

      return response.json()
    },
    onMutate: async ({ templateFields, overrides }) => {
      // Cancel pending task requests
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot previous tasks
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Create optimistic task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: overrides.name || templateFields.title || 'New Task',
        assignee: 'Unassigned',
        team: overrides.team || 'general',
        status: overrides.status || templateFields.status || 'backlog',
        priority: overrides.priority || templateFields.priority || 'medium',
        storyPoints: 0,
        sprint: overrides.sprint || 'sprint-1',
        order: 0,
        estimatedHours:
          overrides.estimatedHours || templateFields.estimatedHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependsOn: [],
      }

      // Optimistically add task to cache
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: Task[] = []) => [
          ...oldData,
          optimisticTask,
        ])
      })

      return { previousTasks, optimisticTask }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: (newTask, _, context) => {
      // Replace optimistic task with real one
      if (context?.optimisticTask) {
        queryClient.setQueryData(['tasks'], (oldData: Task[] = []) =>
          oldData.map((task) =>
            task.id === context.optimisticTask.id ? newTask : task
          )
        )
      }
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['activity', 'feed'] })
    },
  })
}
