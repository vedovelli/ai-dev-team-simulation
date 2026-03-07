import { useQueryClient } from '@tanstack/react-query'
import type { Sprint } from '../../types/sprint'
import { sprintKeys } from '../queries/sprints'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Input type for creating a new sprint
 */
interface CreateSprintInput {
  name: string
  goals: string
  status: 'planning' | 'active' | 'completed'
  estimatedPoints: number
  startDate?: string
  endDate?: string
}

/**
 * Create a new sprint with optimistic updates
 *
 * Features:
 * - Optimistic update: immediately reflects new sprint in list
 * - Automatic retry on failure with exponential backoff
 * - Invalidates sprints list on success for consistency
 */
export const useCreateSprint = () => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: CreateSprintInput): Promise<Sprint> => {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(error.error || 'Failed to create sprint')
      }

      return response.json() as Promise<Sprint>
    },
    onMutate: async (data) => {
      // Cancel pending requests for sprints
      await queryClient.cancelQueries({ queryKey: sprintKeys.all })

      // Snapshot previous data
      const previousSprints = queryClient.getQueriesData<Sprint[]>({
        queryKey: sprintKeys.lists(),
      })

      // Create optimistic sprint
      const optimisticSprint: Sprint = {
        id: `temp-${Date.now()}`,
        name: data.name,
        goals: data.goals,
        status: data.status,
        estimatedPoints: data.estimatedPoints,
        startDate: data.startDate,
        endDate: data.endDate,
        tasks: [],
        taskCount: 0,
        completedCount: 0,
        createdAt: new Date().toISOString(),
      }

      // Update cache with optimistic sprint
      previousSprints.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: Sprint[] = []) => [
          ...oldData,
          optimisticSprint,
        ])
      })

      return { previousSprints, optimisticSprint }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousSprints) {
        context.previousSprints.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: (newSprint, _, context) => {
      // Replace optimistic with real sprint
      if (context?.optimisticSprint) {
        queryClient.setQueryData(sprintKeys.lists(), (oldData: Sprint[] = []) =>
          oldData.map((sprint) =>
            sprint.id === context.optimisticSprint.id ? newSprint : sprint
          )
        )
      }
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() })
    },
  })
}
