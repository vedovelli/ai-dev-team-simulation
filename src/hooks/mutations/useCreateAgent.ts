import { useQueryClient, useMutation } from '@tanstack/react-query'
import type { AgentManagement } from '../../types/agent'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Input type for creating a new agent
 */
interface CreateAgentInput {
  name: string
  capabilities: string[]
  rateLimit?: { requestsPerMinute: number }
}

/**
 * Create a new agent with optimistic updates
 *
 * Features:
 * - Optimistic update: immediately reflects new agent in list
 * - Automatic retry on failure with exponential backoff
 * - Invalidates agents list on success for consistency
 * - Validates agent name uniqueness on server
 */
export const useCreateAgent = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: CreateAgentInput): Promise<AgentManagement> => {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(error.error || 'Failed to create agent')
      }

      return response.json() as Promise<AgentManagement>
    },
    onMutate: async (data) => {
      // Cancel any pending requests for agents
      await queryClient.cancelQueries({ queryKey: ['agents'] })

      // Snapshot the previous agents data
      const previousAgents = queryClient.getQueriesData<AgentManagement[]>({
        queryKey: ['agents'],
      })

      // Create optimistic agent
      const optimisticAgent: AgentManagement = {
        id: `temp-${Date.now()}`,
        name: data.name,
        capabilities: data.capabilities,
        status: 'idle',
        rateLimit: data.rateLimit,
        taskCount: 0,
        successRate: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // If no agents list exists in cache, initialize it with the optimistic agent
      if (previousAgents.length === 0) {
        queryClient.setQueryData(['agents'], [optimisticAgent])
      } else {
        // Optimistically add the new agent to existing cache entries
        previousAgents.forEach(([key]) => {
          queryClient.setQueryData(key, (oldData: AgentManagement[] = []) => [
            ...oldData,
            optimisticAgent,
          ])
        })
      }

      return { previousAgents, optimisticAgent }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousAgents) {
        context.previousAgents.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: (newAgent, _, context) => {
      // Replace optimistic agent with real agent
      if (context?.optimisticAgent) {
        queryClient.setQueryData(['agents'], (oldData: AgentManagement[] = []) =>
          oldData.map((agent) =>
            agent.id === context.optimisticAgent.id ? newAgent : agent
          )
        )
      }
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
