import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../../types/task'
import { useMutationWithRetry } from '../useMutationWithRetry'
import { agentActivityQueryKeys } from '../useAgentActivity'

interface ReassignTaskPayload {
  taskId: string
  fromAgentId: string
  toAgentId: string
}

/**
 * Mutation hook for reassigning tasks between agents
 * Includes optimistic updates, capacity validation, and error rollback
 */
export function useReassignTask() {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async ({ taskId, fromAgentId, toAgentId }: ReassignTaskPayload) => {
      const response = await fetch(`/api/tasks/${taskId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgentId,
          toAgentId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reassign task. Target agent may be at capacity.')
      }

      return response.json() as Promise<Task>
    },

    onMutate: async ({ taskId, fromAgentId, toAgentId }) => {
      // Cancel pending queries for workload and tasks
      await queryClient.cancelQueries({ queryKey: ['agents', 'workload'] })
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot previous data
      const previousWorkload = queryClient.getQueriesData({
        queryKey: ['agents', 'workload'],
      })

      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks'],
      })

      // Optimistically update workload data
      previousWorkload.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: any[] = []) =>
          oldData.map((agent) => {
            if (agent.agentId === fromAgentId) {
              return {
                ...agent,
                activeTasksCount: Math.max(0, agent.activeTasksCount - 1),
                capacityUtilization: Math.max(0, agent.capacityUtilization - 10),
              }
            }
            if (agent.agentId === toAgentId) {
              return {
                ...agent,
                activeTasksCount: agent.activeTasksCount + 1,
                capacityUtilization: Math.min(100, agent.capacityUtilization + 10),
                status:
                  agent.capacityUtilization + 10 > 80
                    ? 'overloaded'
                    : agent.capacityUtilization + 10 > 50
                      ? 'busy'
                      : 'available',
              }
            }
            return agent
          })
        )
      })

      // Optimistically update task data
      previousTasks.forEach(([key]) => {
        queryClient.setQueryData(key, (oldTasks: Task[] = []) =>
          oldTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  assignee: toAgentId,
                  updatedAt: new Date().toISOString(),
                }
              : task
          )
        )
      })

      return { previousWorkload, previousTasks }
    },

    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousWorkload) {
        context.previousWorkload.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      if (context?.previousTasks) {
        context.previousTasks.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },

    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['agents', 'workload'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: agentActivityQueryKeys.all })
    },
  })
}
