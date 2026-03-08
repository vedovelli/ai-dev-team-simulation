import { useQueryClient } from '@tanstack/react-query'
import type { TaskComment } from '../types/task'
import { useMutationWithRetry } from './useMutationWithRetry'

export function useAddTaskComment() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add comment')
      }

      return response.json() as Promise<TaskComment>
    },
    onMutate: async ({ taskId, content }) => {
      // Cancel pending comment requests
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'comments'] })

      // Snapshot previous comments
      const previousComments = queryClient.getQueryData<TaskComment[]>([
        'tasks',
        taskId,
        'comments',
      ])

      // Optimistically add new comment
      const optimisticComment: TaskComment = {
        id: `temp-${Date.now()}`,
        taskId,
        author: 'Current User',
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData(['tasks', taskId, 'comments'], (oldComments: TaskComment[] = []) => [
        ...oldComments,
        optimisticComment,
      ])

      return { previousComments }
    },
    onError: (_, { taskId }, context) => {
      // Revert optimistic update on error
      if (context?.previousComments) {
        queryClient.setQueryData(['tasks', taskId, 'comments'], context.previousComments)
      }
    },
    onSuccess: (_, { taskId }) => {
      // Invalidate comments cache to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] })
    },
  })
}
