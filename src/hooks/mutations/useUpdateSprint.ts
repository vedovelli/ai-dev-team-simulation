import { useQueryClient } from '@tanstack/react-query'
import type { Sprint } from '../../types/sprint'
import { sprintKeys } from '../queries/sprints'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Input type for updating a sprint
 */
interface UpdateSprintInput {
  name: string
  goals: string
  status: 'planning' | 'active' | 'completed'
  estimatedPoints: number
  startDate?: string
  endDate?: string
}

/**
 * Update an existing sprint with optimistic updates
 *
 * Features:
 * - Optimistic update: immediately reflects changes
 * - Automatic retry on failure with exponential backoff
 * - Invalidates sprint detail and list on success
 */
export const useUpdateSprint = (sprintId: string) => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (data: UpdateSprintInput): Promise<Sprint> => {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json() as { error: string }
        throw new Error(error.error || 'Failed to update sprint')
      }

      return response.json() as Promise<Sprint>
    },
    onMutate: async (data) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: sprintKeys.all })

      // Snapshot previous data
      const previousDetail = queryClient.getQueryData<Sprint>(
        sprintKeys.detail(sprintId)
      )

      const previousLists = queryClient.getQueriesData<Sprint[]>({
        queryKey: sprintKeys.lists(),
      })

      // Create optimistic update
      const optimisticSprint: Sprint = previousDetail
        ? { ...previousDetail, ...data }
        : {
            id: sprintId,
            ...data,
            tasks: [],
            taskCount: 0,
            completedCount: 0,
            createdAt: new Date().toISOString(),
          }

      // Update detail cache
      queryClient.setQueryData(sprintKeys.detail(sprintId), optimisticSprint)

      // Update list caches
      previousLists.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: Sprint[] = []) =>
          oldData.map((sprint) =>
            sprint.id === sprintId ? optimisticSprint : sprint
          )
        )
      })

      return { previousDetail, previousLists, optimisticSprint }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousDetail) {
        queryClient.setQueryData(
          sprintKeys.detail(sprintId),
          context.previousDetail
        )
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSuccess: (newSprint) => {
      // Update detail with real data
      queryClient.setQueryData(sprintKeys.detail(sprintId), newSprint)
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() })
    },
  })
}
