import { useTaskAssignment, type AssignmentError } from './useTaskAssignment'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task } from '../types/task'
import type { Agent } from '../types/agent'

export interface AgentCapacityData {
  agentId: string
  name: string
  currentTasks: number
  maxTasks: number
  workload: 'low' | 'medium' | 'high' | 'overloaded'
}

export interface BulkAssignmentVariables {
  taskIds: string[]
  agentId: string
}

/**
 * Hook for bulk task assignment with capacity validation
 *
 * Features:
 * - Assign multiple tasks to a single agent
 * - Pre-assignment capacity checking
 * - Over-capacity warning with override support
 * - Optimistic updates for all selected tasks
 *
 * @example
 * ```tsx
 * const { assignBulk, isPending, capacityData } = useBulkAssignment()
 *
 * // Check capacity before showing UI
 * const canAssign = capacityData[agentId]?.currentTasks + selectedTasks.length <= 10
 *
 * // Perform bulk assignment
 * await assignBulk({
 *   taskIds: ['task-1', 'task-2'],
 *   agentId: 'agent-1'
 * })
 * ```
 */
export function useBulkAssignment() {
  const { assignAsync, isPending, checkAgentCapacity } = useTaskAssignment()
  const queryClient = useQueryClient()

  /**
   * Fetch all agents with capacity info
   */
  const { data: capacityData = {}, isLoading: isLoadingCapacity } = useQuery<Record<string, AgentCapacityData>>({
    queryKey: ['agents', 'capacity'],
    queryFn: async () => {
      const response = await fetch('/api/agents/capacity')
      if (!response.ok) {
        throw new Error('Failed to fetch agent capacity')
      }
      const result = await response.json()
      return result.data || {}
    },
    staleTime: 30000, // 30 seconds
  })

  /**
   * Perform bulk assignment with validation
   */
  const assignBulk = async (variables: BulkAssignmentVariables, options?: { skipValidation?: boolean }) => {
    const { taskIds, agentId } = variables

    // Check capacity before assignment
    const capacity = await checkAgentCapacity(agentId)
    const projectedLoad = capacity.currentTasks + taskIds.length

    if (!options?.skipValidation && projectedLoad > capacity.maxTasks) {
      throw new Error(
        `Cannot assign ${taskIds.length} tasks to ${capacity.agentId}. Current: ${capacity.currentTasks}, Capacity: ${capacity.maxTasks}`
      )
    }

    // Perform individual assignments sequentially
    const results: Array<{ taskId: string; success: boolean; error?: AssignmentError | Error }> = []

    for (const taskId of taskIds) {
      try {
        await assignAsync({ taskId, agentId })
        results.push({ taskId, success: true })
      } catch (error) {
        results.push({ taskId, success: false, error: error as AssignmentError | Error })
      }
    }

    // Invalidate capacity cache to refresh
    queryClient.invalidateQueries({ queryKey: ['agents', 'capacity'] })

    return results
  }

  return {
    assignBulk,
    isPending,
    isLoadingCapacity,
    capacityData,
  }
}
