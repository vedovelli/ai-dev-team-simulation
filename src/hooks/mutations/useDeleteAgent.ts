import { useQueryClient } from '@tanstack/react-query'
import type { AgentManagement } from '../../types/agent'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Delete an agent (soft delete)
 *
 * Features:
 * - Soft delete: agent marked as deleted but not removed from database
 * - Optimistic update: immediately removes from UI
 * - Automatic retry on failure with exponential backoff
 * - Invalidates agents list on success
 * - Server validates: no active tasks before deletion
 */
export const useDeleteAgent = (agentId: string) => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (): Promise<{ success: true; message: string }> => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(error.error || 'Failed to delete agent')
      }

      return response.json() as Promise<{ success: true; message: string }>
    },
    onMutate: async () => {
      // Cancel any pending requests for this agent and list
      await queryClient.cancelQueries({ queryKey: ['agents', agentId] })
      await queryClient.cancelQueries({ queryKey: ['agents'] })

      // Snapshot the previous data
      const previousAgent = queryClient.getQueryData<AgentManagement>(['agents', agentId])
      const previousAgents = queryClient.getQueriesData<AgentManagement[]>({
        queryKey: ['agents'],
      })

      // Optimistically remove the agent from lists
      previousAgents.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: AgentManagement[] = []) =>
          oldData.filter((agent) => agent.id !== agentId)
        )
      })

      // Remove from detail view
      queryClient.removeQueries({ queryKey: ['agents', agentId] })

      return { previousAgent, previousAgents }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousAgent) {
        queryClient.setQueryData(['agents', agentId], context.previousAgent)
      }
      if (context?.previousAgents) {
        context.previousAgents.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: () => {
      // Refetch list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
