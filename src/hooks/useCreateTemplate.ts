import { useQueryClient } from '@tanstack/react-query'
import type { CreateTemplateInput, TaskTemplate } from '../types/template'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Create a new task template
 *
 * Uses optimistic updates to provide immediate feedback while
 * the request is being processed. On error, reverts to previous state.
 *
 * @returns Mutation object with mutate function and status
 *
 * @example
 * const { mutate, isPending } = useCreateTemplate()
 * const handleCreate = (data: CreateTemplateInput) => {
 *   mutate(data, {
 *     onSuccess: () => console.log('Template created')
 *   })
 * }
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: CreateTemplateInput): Promise<TaskTemplate> => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create template')
      }

      return response.json()
    },
    onMutate: async (data) => {
      // Cancel pending requests for templates
      await queryClient.cancelQueries({ queryKey: ['templates'] })

      // Snapshot previous templates
      const previousTemplates = queryClient.getQueryData<TaskTemplate[]>([
        'templates',
      ])

      // Create optimistic template
      const optimisticTemplate: TaskTemplate = {
        id: `temp-${Date.now()}`,
        name: data.name,
        description: data.description,
        defaultFields: data.defaultFields,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update cache with optimistic data
      queryClient.setQueryData(['templates'], (oldData: TaskTemplate[] = []) => [
        ...oldData,
        optimisticTemplate,
      ])

      return { previousTemplates, optimisticTemplate }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(['templates'], context.previousTemplates)
      }
    },
    onSuccess: (newTemplate, _, context) => {
      // Replace optimistic template with real one
      if (context?.optimisticTemplate) {
        queryClient.setQueryData(['templates'], (oldData: TaskTemplate[] = []) =>
          oldData.map((t) =>
            t.id === context.optimisticTemplate.id ? newTemplate : t
          )
        )
      }
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
