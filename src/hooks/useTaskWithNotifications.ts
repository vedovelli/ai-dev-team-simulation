import { useCreateTask } from './useCreateTask'
import { useUpdateTask } from './useUpdateTask'
import { useDeleteTask } from './useDeleteTask'
import { useNotification } from './useNotification'
import type { CreateTaskInput, UpdateTaskInput } from '../types/taskValidation'
import type { Task } from '../types/task'

/**
 * Task mutation hooks with integrated notification feedback
 *
 * This is a proof of concept showing how to integrate the notification system
 * with mutation hooks. When mutations complete, success/error notifications
 * are automatically displayed.
 *
 * @example
 * ```tsx
 * const { create, update, delete: deleteTask } = useTaskWithNotifications()
 *
 * // Automatically shows success/error notifications
 * create.mutate(newTaskData)
 * ```
 */
export function useTaskWithNotifications() {
  const { success, error } = useNotification()

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const deleteMutation = useDeleteTask()

  const wrappedCreate = {
    mutate: (data: CreateTaskInput) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          success('Task created successfully!')
        },
        onError: (err) => {
          error(err instanceof Error ? err.message : 'Failed to create task')
        },
      })
    },
    mutateAsync: async (data: CreateTaskInput) => {
      try {
        const result = await createMutation.mutateAsync(data)
        success('Task created successfully!')
        return result
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to create task')
        throw err
      }
    },
    isPending: createMutation.isPending,
    error: createMutation.error,
  }

  const wrappedUpdate = {
    mutate: (variables: { id: string; data: UpdateTaskInput }) => {
      updateMutation.mutate(variables, {
        onSuccess: () => {
          success('Task updated successfully!')
        },
        onError: (err) => {
          error(err instanceof Error ? err.message : 'Failed to update task')
        },
      })
    },
    mutateAsync: async (variables: { id: string; data: UpdateTaskInput }) => {
      try {
        const result = await updateMutation.mutateAsync(variables)
        success('Task updated successfully!')
        return result
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to update task')
        throw err
      }
    },
    isPending: updateMutation.isPending,
    error: updateMutation.error,
  }

  const wrappedDelete = {
    mutate: (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          success('Task deleted successfully!')
        },
        onError: (err) => {
          error(err instanceof Error ? err.message : 'Failed to delete task')
        },
      })
    },
    mutateAsync: async (id: string) => {
      try {
        const result = await deleteMutation.mutateAsync(id)
        success('Task deleted successfully!')
        return result
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to delete task')
        throw err
      }
    },
    isPending: deleteMutation.isPending,
    error: deleteMutation.error,
  }

  return {
    create: wrappedCreate,
    update: wrappedUpdate,
    delete: wrappedDelete,
  }
}
