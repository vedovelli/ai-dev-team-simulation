import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TaskFormData, Task } from '../types/task'

interface UseTaskFormOptions {
  initialTask?: Task | null
  onSuccess?: (task: Task) => void
  onError?: (error: Error) => void
}

export function useTaskForm(options: UseTaskFormOptions = {}) {
  const { initialTask, onSuccess, onError } = options
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create task')
      }

      return response.json() as Promise<Task>
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onSuccess?.(task)
    },
    onError: (error) => {
      setServerError(
        error instanceof Error ? error.message : 'An error occurred',
      )
      onError?.(error as Error)
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!initialTask) {
        throw new Error('No task to update')
      }

      const response = await fetch(`/api/tasks/${initialTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update task')
      }

      return response.json() as Promise<Task>
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', initialTask?.id] })
      onSuccess?.(task)
    },
    onError: (error) => {
      setServerError(
        error instanceof Error ? error.message : 'An error occurred',
      )
      onError?.(error as Error)
    },
  })

  const handleSubmit = useCallback(
    async (data: TaskFormData) => {
      setIsSubmitting(true)
      setServerError(null)

      try {
        if (initialTask) {
          await updateTaskMutation.mutateAsync(data)
        } else {
          await createTaskMutation.mutateAsync(data)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [initialTask, createTaskMutation, updateTaskMutation],
  )

  return {
    handleSubmit,
    isSubmitting:
      isSubmitting ||
      createTaskMutation.isPending ||
      updateTaskMutation.isPending,
    serverError,
    setServerError,
    isEditing: !!initialTask,
  }
}
