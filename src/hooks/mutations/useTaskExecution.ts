import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { useMutationWithRetry } from '../useMutationWithRetry'

export type TaskExecutionAction = 'start' | 'pause' | 'complete' | 'blocked'

interface ExecuteTaskInput {
  taskId: string
  action: TaskExecutionAction
  notes?: string
}

interface TaskExecutionResponse {
  task: Task
  message: string
}

/**
 * Manage task execution with status transitions and optimistic updates
 *
 * Supports actions:
 * - start: not_started → in_progress
 * - pause: in_progress → backlog (blocks task)
 * - complete: in_progress → done
 * - blocked: any status → blocked state
 *
 * Features:
 * - Optimistic updates for snappy UI
 * - Automatic rollback on error
 * - Invalidates task and tasks list on success
 */
export const useTaskExecution = () => {
  const queryClient = useQueryClient()

  const executeMutation = useMutationWithRetry({
    mutationFn: async (data: ExecuteTaskInput): Promise<TaskExecutionResponse> => {
      const response = await fetch(`/api/tasks/${data.taskId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: data.action,
          notes: data.notes,
        }),
      })

      if (!response.ok) {
        const error = (await response.json()) as { error: string }
        throw new Error(error.error || 'Failed to execute task action')
      }

      return response.json() as Promise<TaskExecutionResponse>
    },
    onMutate: async (data) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      await queryClient.cancelQueries({ queryKey: ['task', data.taskId] })

      // Snapshot previous data for rollback
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })
      const previousTask = queryClient.getQueryData<Task>([
        'task',
        data.taskId,
      ])

      // Optimistic update
      queryClient.setQueryData<Task>(
        ['task', data.taskId],
        (oldTask) => {
          if (!oldTask) return oldTask

          const statusMap: Record<TaskExecutionAction, Task['status']> = {
            start: 'in-progress',
            pause: 'backlog',
            complete: 'done',
            blocked: 'backlog', // Could be a separate status but using backlog for now
          }

          return {
            ...oldTask,
            status: statusMap[data.action],
            updatedAt: new Date().toISOString(),
          }
        }
      )

      // Optimistic update in lists
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData<Task[]>(key, (oldTasks) => {
          if (!oldTasks) return oldTasks

          const statusMap: Record<TaskExecutionAction, Task['status']> = {
            start: 'in-progress',
            pause: 'backlog',
            complete: 'done',
            blocked: 'backlog',
          }

          return oldTasks.map((task) => {
            if (task.id === data.taskId) {
              return {
                ...task,
                status: statusMap[data.action],
                updatedAt: new Date().toISOString(),
              }
            }
            return task
          })
        })
      })

      return { previousTasks, previousTask }
    },
    onError: (error, data, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(['task', data.taskId], context.previousTask)
      }

      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, value]) => {
          queryClient.setQueryData(key, value)
        })
      }
    },
    onSuccess: (data, variables) => {
      // Update single task
      queryClient.setQueryData(['task', variables.taskId], data.task)

      // Invalidate lists to refetch if needed
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return {
    executeTask: executeMutation.mutate,
    executeTaskAsync: executeMutation.mutateAsync,
    isPending: executeMutation.isPending,
    error: executeMutation.error,
  }
}
