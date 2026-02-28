import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task, UpdateTaskInput } from '../types/task'

export function useTaskReorder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; data: UpdateTaskInput }>) => {
      const results = await Promise.all(
        updates.map(({ id, data }) =>
          fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to update task ${id}`)
              }
              return response.json() as Promise<Task>
            })
        )
      )
      return results
    },
    onMutate: async (updates) => {
      // Cancel any pending requests for tasks
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot the previous tasks data
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Optimistically update all task queries
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) => {
            const update = updates.find((u) => u.id === task.id)
            return update
              ? {
                  ...task,
                  ...update.data,
                  updatedAt: new Date().toISOString(),
                }
              : task
          })
        )
      })

      return { previousTasks }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: () => {
      // Refetch tasks to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
