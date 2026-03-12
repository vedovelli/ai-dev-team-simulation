import { useQueryClient } from '@tanstack/react-query'
import type { Sprint } from '../../types/sprint'
import { sprintKeys } from '../queries/sprints'
import { useConflictAwareMutation } from '../useConflictAwareMutation'

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
  version?: number
}

/**
 * Update an existing sprint with optimistic updates and conflict detection
 *
 * Features:
 * - Optimistic update: immediately reflects changes
 * - Version-based conflict detection with 409 handling
 * - Automatic retry on failure with exponential backoff
 * - Invalidates sprint detail and list on success
 */
export const useUpdateSprint = (sprintId: string) => {
  const queryClient = useQueryClient()

  return useConflictAwareMutation({
    mutationFn: async (data: UpdateSprintInput): Promise<Sprint> => {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json() as { error?: string; serverVersion?: Sprint }
        if (response.status === 409) {
          throw new Error(`409: conflict with serverVersion: ${JSON.stringify(error.serverVersion || {})}`)
        }
        throw new Error(error.error || 'Failed to update sprint')
      }

      return response.json() as Promise<Sprint>
    },
    queryKeyFn: () => sprintKeys.detail(sprintId),
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

      // Create optimistic update - use list data if detail not cached
      let optimisticSprint: Sprint
      if (previousDetail) {
        optimisticSprint = { ...previousDetail, ...data, version: (previousDetail.version || 1) + 1 }
      } else {
        // Find sprint in list cache as fallback
        let foundInList: Sprint | undefined
        previousLists.forEach(([, listData]) => {
          if (listData && !foundInList) {
            foundInList = listData.find((s) => s.id === sprintId)
          }
        })

        if (foundInList) {
          optimisticSprint = { ...foundInList, ...data, version: (foundInList.version || 1) + 1 }
        } else {
          // Last resort: create minimal object (shouldn't happen in normal flow)
          optimisticSprint = {
            id: sprintId,
            ...data,
            tasks: [],
            taskCount: 0,
            completedCount: 0,
            version: 1,
            createdAt: new Date().toISOString(),
          } as Sprint
        }
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
