import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateTaskInput } from '../types/taskValidation'
import type { Task } from '../types/task'

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
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
    onSuccess: (newTask) => {
      // Optimistic update: add the new task to the cache
      queryClient.setQueryData(['tasks'], (oldData: Task[] = []) => [
        ...oldData,
        newTask,
      ])
    },
  })
}
