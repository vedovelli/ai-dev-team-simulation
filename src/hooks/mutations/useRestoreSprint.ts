import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Sprint } from '../../types/sprint'
import { sprintKeys } from '../queries/sprints'

/**
 * Hook for restoring an archived sprint back to its previous status.
 * Simple status toggle - defaults to 'completed' status.
 *
 * @returns Mutation object with restoreSprint function and loading/error states
 */
export function useRestoreSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sprintId, restoreStatus }: { sprintId: string; restoreStatus: 'completed' | 'active' | 'planning' }) => {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: restoreStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to restore sprint')
      }

      return response.json() as Promise<Sprint>
    },

    onMutate: async ({ sprintId, restoreStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sprintKeys.detail(sprintId) })
      await queryClient.cancelQueries({ queryKey: sprintKeys.lists() })

      // Snapshot previous values
      const previousSprint = queryClient.getQueryData<Sprint>(
        sprintKeys.detail(sprintId)
      )
      const previousList = queryClient.getQueryData(sprintKeys.lists())

      // Optimistically update sprint detail
      if (previousSprint) {
        queryClient.setQueryData(sprintKeys.detail(sprintId), {
          ...previousSprint,
          status: restoreStatus,
        })
      }

      return { previousSprint, previousList }
    },

    onError: (error, { sprintId }, context) => {
      // Rollback optimistic updates
      if (context?.previousSprint) {
        queryClient.setQueryData(
          sprintKeys.detail(sprintId),
          context.previousSprint
        )
      }
      if (context?.previousList) {
        queryClient.setQueryData(sprintKeys.lists(), context.previousList)
      }
    },

    onSuccess: (sprint) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(sprint.id) })
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() })
      queryClient.invalidateQueries({ queryKey: sprintKeys.list({ archived: false }) })
      queryClient.invalidateQueries({ queryKey: sprintKeys.list({ archived: true }) })
    },
  })
}
