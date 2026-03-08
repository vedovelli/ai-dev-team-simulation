import { useQueryClient } from '@tanstack/react-query'
import type { AgentSettings } from '../../lib/validation'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Update agent settings with optimistic updates and cache invalidation
 *
 * Features:
 * - Optimistic update: immediately reflects changes in UI
 * - Automatic retry on failure with exponential backoff
 * - Invalidates agent queries on success
 * - Async validation support for cross-field conflicts
 */
export const useUpdateAgentSettings = (agentId: string) => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: AgentSettings): Promise<AgentSettings> => {
      const response = await fetch(`/api/agents/${agentId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(error.error || 'Failed to update agent settings')
      }

      return response.json() as Promise<AgentSettings>
    },
    onMutate: async (data) => {
      // Cancel any pending requests for agent settings
      await queryClient.cancelQueries({ queryKey: ['agents', agentId, 'settings'] })
      await queryClient.cancelQueries({ queryKey: ['agents', agentId] })

      // Snapshot the previous data
      const previousSettings = queryClient.getQueryData<AgentSettings>([
        'agents',
        agentId,
        'settings',
      ])

      // Optimistically update the settings
      if (previousSettings) {
        const optimisticSettings = { ...previousSettings, ...data }
        queryClient.setQueryData(['agents', agentId, 'settings'], optimisticSettings)
      }

      return { previousSettings }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          ['agents', agentId, 'settings'],
          context.previousSettings
        )
      }
    },
    onSuccess: (newSettings) => {
      // Update cache with confirmed settings
      queryClient.setQueryData(['agents', agentId, 'settings'], newSettings)
      // Invalidate agent list since settings affect agent behavior
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      // Invalidate activity feed since settings may affect task assignment
      queryClient.invalidateQueries({ queryKey: ['activity', 'feed'] })
    },
  })
}
