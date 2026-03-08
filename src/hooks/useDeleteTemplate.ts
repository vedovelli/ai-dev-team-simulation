import { useQueryClient } from '@tanstack/react-query'
import type { TaskTemplate } from '../types/template'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Delete a task template
 *
 * Uses optimistic updates. On error, reverts to previous state.
 *
 * @returns Mutation object with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useDeleteTemplate()
 * const handleDelete = (id: string) => {
 *   mutate(id, {
 *     onSuccess: () => console.log('Template deleted')
 *   })
 * }
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete template')
      }
    },
    onMutate: async (id) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: ['templates'] })

      // Snapshot previous templates
      const previousTemplates = queryClient.getQueryData<TaskTemplate[]>([
        'templates',
      ])

      // Remove from cache optimistically
      queryClient.setQueryData(['templates'], (oldData: TaskTemplate[] = []) =>
        oldData.filter((t) => t.id !== id)
      )

      return { previousTemplates }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['templates'], context.previousTemplates)
      }
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
