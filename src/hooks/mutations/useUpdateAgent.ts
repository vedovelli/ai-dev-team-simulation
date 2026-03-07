import { useQueryClient } from '@tanstack/react-query'
import type { AgentManagement, AgentTaskStatus } from '../../types/agent'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Input type for updating an agent (all fields optional for partial updates)
 */
interface UpdateAgentInput {
  name?: string
  capabilities?: string[]
  status?: AgentTaskStatus
  rateLimit?: { requestsPerMinute: number }
  taskCount?: number
  successRate?: number
}

/**
 * Update an existing agent with optimistic updates
 *
 * Features:
 * - Optimistic update: immediately reflects changes in UI
 * - Automatic retry on failure with exponential backoff
 * - Supports partial updates (only changed fields)
 * - Invalidates specific agent detail on success
 */
export const useUpdateAgent = (agentId: string) => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: UpdateAgentInput): Promise<AgentManagement> => {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(error.error || 'Failed to update agent')
      }

      return response.json() as Promise<AgentManagement>
    },
    onMutate: async (data) => {
      // Cancel any pending requests for this agent
      await queryClient.cancelQueries({ queryKey: ['agents', agentId] })
      await queryClient.cancelQueries({ queryKey: ['agents'] })

      // Snapshot the previous data
      const previousAgent = queryClient.getQueryData<AgentManagement>(['agents', agentId])
      const previousAgents = queryClient.getQueriesData<AgentManagement[]>({
        queryKey: ['agents'],
      })

      // Optimistically update the agent
      if (previousAgent) {
        const optimisticAgent = { ...previousAgent, ...data }
        queryClient.setQueryData(['agents', agentId], optimisticAgent)

        // Also update in list
        previousAgents.forEach(([key]) => {
          queryClient.setQueryData(key, (oldData: AgentManagement[] = []) =>
            oldData.map((agent) =>
              agent.id === agentId ? optimisticAgent : agent
            )
          )
        })
      }

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
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['agents', agentId] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
