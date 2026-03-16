import { useQueryClient } from '@tanstack/react-query'
import type { Sprint } from '../../types/sprint'
import { sprintKeys } from '../queries/sprints'
import { useMutationWithRetry } from '../useMutationWithRetry'

/**
 * Valid sprint state transitions
 * Defines the allowed state machine transitions
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  planning: ['active'],
  active: ['in-review'],
  'in-review': ['completed'],
  completed: [],
  archived: [],
}

/**
 * Error response structure for transition failures
 */
interface TransitionError {
  code: string
  message: string
  count?: number
}

/**
 * Response from transition endpoint
 */
interface TransitionResponse {
  success: boolean
  sprint?: Sprint
  error?: TransitionError
}

/**
 * Hook for managing sprint lifecycle state transitions
 *
 * Features:
 * - State machine with defined valid transitions: planning → active → in-review → completed
 * - Optimistic updates with rollback on error
 * - Hard block: cannot complete sprint with incomplete tasks
 * - Cache invalidation for sprint metrics and tasks on successful transition
 * - Clear error messages for validation failures
 */
export const useSprintLifecycle = (sprintId: string) => {
  const queryClient = useQueryClient()

  return useMutationWithRetry({
    mutationFn: async (newState: string): Promise<TransitionResponse> => {
      // Validate state machine on client side
      const currentSprint = queryClient.getQueryData<Sprint>(
        sprintKeys.detail(sprintId)
      )

      if (!currentSprint) {
        throw new Error('Sprint not found in cache')
      }

      if (!VALID_TRANSITIONS[currentSprint.status]?.includes(newState)) {
        throw new Error(
          `Invalid transition from ${currentSprint.status} to ${newState}`
        )
      }

      const response = await fetch(`/api/sprints/${sprintId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newState }),
      })

      if (!response.ok) {
        const error = (await response.json()) as TransitionResponse
        if (response.status === 422) {
          throw new Error(
            JSON.stringify({
              code: error.error?.code,
              message: error.error?.message,
              count: error.error?.count,
            })
          )
        }
        throw new Error('Failed to transition sprint state')
      }

      return response.json() as Promise<TransitionResponse>
    },
    onMutate: async (newState) => {
      // Cancel pending requests
      await queryClient.cancelQueries({ queryKey: sprintKeys.all })

      // Get current sprint
      const previousDetail = queryClient.getQueryData<Sprint>(
        sprintKeys.detail(sprintId)
      )

      if (!previousDetail) {
        throw new Error('Sprint not found')
      }

      // Create optimistic update with new state
      const optimisticSprint: Sprint = {
        ...previousDetail,
        status: newState as any,
        version: (previousDetail.version || 1) + 1,
      }

      // Update detail cache
      queryClient.setQueryData(sprintKeys.detail(sprintId), optimisticSprint)

      // Update list caches
      const previousLists = queryClient.getQueriesData<Sprint[]>({
        queryKey: sprintKeys.lists(),
      })

      previousLists.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: Sprint[] = []) =>
          oldData.map((sprint) =>
            sprint.id === sprintId ? optimisticSprint : sprint
          )
        )
      })

      return { previousDetail, previousLists, newState }
    },
    onError: (error, _, context) => {
      // Revert optimistic update on error
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

      // Store error for access via transitionError
      ;(window as any).__sprintTransitionError = error.message
    },
    onSuccess: (response) => {
      if (response.sprint) {
        // Update detail with real data
        queryClient.setQueryData(sprintKeys.detail(sprintId), response.sprint)
      }

      // Invalidate related caches
      queryClient.invalidateQueries({
        queryKey: ['sprints', sprintId, 'metrics'],
      })
      queryClient.invalidateQueries({
        queryKey: ['sprints', sprintId, 'tasks'],
      })

      // Clear any previous error
      ;(window as any).__sprintTransitionError = null
    },
  })
}

/**
 * Extract transition error from mutation response
 *
 * Parses JSON error strings that may contain structured error info
 */
export function parseTransitionError(
  error: Error | null
): TransitionError | null {
  if (!error) return null

  try {
    return JSON.parse(error.message) as TransitionError
  } catch {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    }
  }
}
