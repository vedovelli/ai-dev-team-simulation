import { useQueryClient } from '@tanstack/react-query'
import type {
  CapacityAdjustmentRequest,
  CapacityAdjustmentResponse,
  AgentCapacityMetricsResponse,
} from '../../types/capacity'
import { useMutationWithRetry } from '../useMutationWithRetry'
import { capacityKeys } from '../queries/capacity'

/**
 * Adjust agent maximum capacity with optimistic updates
 *
 * Features:
 * - Optimistic update: immediately reflects changes in UI
 * - Automatic retry on failure with exponential backoff
 * - Invalidates capacity query on success
 * - Rollback on error
 *
 * @param sprintId - The sprint ID for cache invalidation
 * @returns Mutation function and status
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCapacityAdjustment(sprintId)
 * const handleAdjust = () => {
 *   mutate({
 *     agentId: 'agent-1',
 *     newMaxCapacity: 15,
 *   })
 * }
 * ```
 */
export const useCapacityAdjustment = (sprintId: string | null | undefined) => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (
      data: CapacityAdjustmentRequest
    ): Promise<CapacityAdjustmentResponse> => {
      const response = await fetch(
        `/api/agents/${data.agentId}/capacity`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newMaxCapacity: data.newMaxCapacity }),
        }
      )

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(
          error.error || 'Failed to adjust agent capacity'
        )
      }

      return response.json() as Promise<CapacityAdjustmentResponse>
    },
    onMutate: async (data) => {
      // Cancel any pending requests for this sprint's capacity
      if (sprintId) {
        await queryClient.cancelQueries({
          queryKey: capacityKeys.bySprintId(sprintId),
        })
      }

      // Snapshot the previous data
      const previousData = sprintId
        ? queryClient.getQueryData<AgentCapacityMetricsResponse>(
            capacityKeys.bySprintId(sprintId)
          )
        : null

      // Optimistically update the agent's capacity
      if (previousData && sprintId) {
        const optimisticData = {
          ...previousData,
          agents: previousData.agents.map((agent) =>
            agent.agentId === data.agentId
              ? {
                  ...agent,
                  maxCapacity: data.newMaxCapacity,
                  utilizationPct: Math.round(
                    (agent.currentLoad / data.newMaxCapacity) * 100
                  ),
                  warningLevel:
                    (agent.currentLoad / data.newMaxCapacity) * 100 > 95
                      ? 'critical'
                      : (agent.currentLoad / data.newMaxCapacity) * 100 > 80
                        ? 'warning'
                        : 'ok',
                }
              : agent
          ),
        }
        queryClient.setQueryData(
          capacityKeys.bySprintId(sprintId),
          optimisticData
        )
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic update on error
      if (context?.previousData && sprintId) {
        queryClient.setQueryData(
          capacityKeys.bySprintId(sprintId),
          context.previousData
        )
      }
    },
    onSuccess: () => {
      // Invalidate capacity query to refetch fresh data
      if (sprintId) {
        queryClient.invalidateQueries({
          queryKey: capacityKeys.bySprintId(sprintId),
        })
      }
    },
  })
}
