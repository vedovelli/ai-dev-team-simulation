import { useQueryClient } from '@tanstack/react-query'
import type { TaskTemplate, UpdateTemplateInput } from '../types/template'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Update an existing task template
 *
 * Uses optimistic updates. On error, reverts to previous state.
 *
 * @returns Mutation object with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useUpdateTemplate()
 * const handleUpdate = (id: string, data: UpdateTemplateInput) => {
 *   mutate({ id, data }, {
 *     onSuccess: () => console.log('Template updated')
 *   })
 * }
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateTemplateInput
    }): Promise<TaskTemplate> => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update template')
      }

      return response.json()
    },
    onMutate: async ({ id, data }) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: ['templates'] })

      // Snapshot previous templates
      const previousTemplates = queryClient.getQueryData<TaskTemplate[]>([
        'templates',
      ])

      // Update cache optimistically
      queryClient.setQueryData(['templates'], (oldData: TaskTemplate[] = []) =>
        oldData.map((t) =>
          t.id === id
            ? {
                ...t,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
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
