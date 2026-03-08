import { useQueryClient } from '@tanstack/react-query'
import { useMutationWithRetry } from '../useMutationWithRetry'

interface AddCommentInput {
  taskId: string
  content: string
}

interface TaskComment {
  id: string
  author: string
  content: string
  createdAt: string
}

/**
 * Manage task comments with optimistic updates
 *
 * Features:
 * - Optimistic updates for instant feedback
 * - Automatic rollback on error
 * - Invalidates comments list on success
 */
export const useTaskComments = () => {
  const queryClient = useQueryClient()

  const addCommentMutation = useMutationWithRetry({
    mutationFn: async (data: AddCommentInput): Promise<TaskComment> => {
      const response = await fetch(`/api/tasks/${data.taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
        }),
      })

      if (!response.ok) {
        const error = (await response.json()) as { error: string }
        throw new Error(error.error || 'Failed to add comment')
      }

      return response.json() as Promise<TaskComment>
    },
    onMutate: async (data) => {
      // Cancel pending requests
      await queryClient.cancelQueries({
        queryKey: ['task', data.taskId, 'comments'],
      })

      // Snapshot previous data for rollback
      const previousComments = queryClient.getQueryData<TaskComment[]>([
        'task',
        data.taskId,
        'comments',
      ])

      // Optimistic update - add temporary comment
      const optimisticComment: TaskComment = {
        id: `temp-${Date.now()}`,
        author: 'You',
        content: data.content,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<TaskComment[]>(
        ['task', data.taskId, 'comments'],
        (oldComments) => {
          return oldComments ? [...oldComments, optimisticComment] : [optimisticComment]
        }
      )

      return { previousComments }
    },
    onError: (error, data, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['task', data.taskId, 'comments'],
          context.previousComments
        )
      }
    },
    onSuccess: (newComment, data) => {
      // Update comments list with actual comment from server
      queryClient.setQueryData<TaskComment[]>(
        ['task', data.taskId, 'comments'],
        (oldComments) => {
          if (!oldComments) return [newComment]
          // Replace optimistic comment with actual one
          return oldComments
            .filter((c) => !c.id.startsWith('temp-'))
            .concat(newComment)
        }
      )
    },
  })

  return {
    addComment: addCommentMutation.mutate,
    addCommentAsync: addCommentMutation.mutateAsync,
    isPending: addCommentMutation.isPending,
    error: addCommentMutation.error,
  }
}
