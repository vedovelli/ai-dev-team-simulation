/**
 * Sprint backlog reordering hook with optimistic updates
 *
 * Provides a mutation for reordering tasks within a sprint with:
 * - Optimistic updates (immediate UI feedback)
 * - Automatic rollback on error
 * - Debounced mutations to batch rapid drags
 * - Query invalidation on success
 */

import { useQueryClient, useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useRef, useCallback, useEffect } from 'react'
import type { Task } from '../types/task'

export interface ReorderPayload {
  taskIds: string[]
}

export interface ReorderResponse {
  success: boolean
  sprintId: string
  taskIds: string[]
  message: string
}

export interface UseSprintReorderReturn {
  mutate: (sprintId: string, taskIds: string[]) => void
  mutateAsync: (sprintId: string, taskIds: string[]) => Promise<ReorderResponse>
  isPending: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}

interface UseSprintReorderOptions extends Omit<UseMutationOptions<ReorderResponse, Error, { sprintId: string; payload: ReorderPayload }>, 'mutationFn'> {
  debounceMs?: number
}

/**
 * Mutation hook for reordering sprint tasks
 *
 * Features:
 * - Optimistic updates: immediately apply reorder to local cache
 * - Debounced execution: batch rapid drag/drop operations (default 500ms)
 * - Automatic rollback: restore previous state if mutation fails
 * - Query invalidation: ensures consistency after successful update
 *
 * @param options - Configuration options for the mutation
 * @returns Mutation utilities with debounced mutate function
 *
 * @example
 * ```tsx
 * const { mutate: reorder, isPending } = useSprintReorder()
 *
 * // After user drags task from index 0 to index 2:
 * const newOrder = moveTaskInList(tasks, 0, 2)
 * reorder(sprintId, newOrder.map(t => t.id))
 * ```
 */
export function useSprintReorder(options?: UseSprintReorderOptions): UseSprintReorderReturn {
  const queryClient = useQueryClient()
  const debounceMs = options?.debounceMs ?? 500

  // Debounce references
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingMutationRef = useRef<{ sprintId: string; payload: ReorderPayload } | null>(null)

  const mutation = useMutation({
    ...options,
    mutationFn: async ({ sprintId, payload }: { sprintId: string; payload: ReorderPayload }) => {
      const response = await fetch(`/api/sprints/${sprintId}/tasks/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder tasks')
      }

      return response.json() as Promise<ReorderResponse>
    },

    onMutate: async ({ sprintId, payload }) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['sprints', sprintId, 'tasks'],
      })

      // Snapshot current state
      const previousTasks = queryClient.getQueryData<Task[]>([
        'sprints',
        sprintId,
        'tasks',
      ])

      // Optimistically update the task list
      if (previousTasks) {
        // Create a map of task IDs to their original objects
        const taskMap = new Map(previousTasks.map((task) => [task.id, task]))

        // Build the new task list with the new order
        const optimisticTasks = payload.taskIds
          .map((taskId) => taskMap.get(taskId))
          .filter((task): task is Task => task !== undefined)

        queryClient.setQueryData(['sprints', sprintId, 'tasks'], optimisticTasks)
      }

      return { previousTasks, sprintId }
    },

    onError: (_, __, context) => {
      // Revert optimistic update on error
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['sprints', context.sprintId, 'tasks'],
          context.previousTasks
        )
      }
    },

    onSuccess: (_, { sprintId }) => {
      // Invalidate the tasks query to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['sprints', sprintId, 'tasks'],
      })
    },
  })

  // Debounced mutate function
  const debouncedMutate = useCallback(
    (sprintId: string, taskIds: string[]) => {
      const payload: ReorderPayload = { taskIds }

      // Clear existing timer if present
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Store the pending mutation
      pendingMutationRef.current = { sprintId, payload }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        if (pendingMutationRef.current) {
          mutation.mutate(pendingMutationRef.current)
          pendingMutationRef.current = null
        }
      }, debounceMs)
    },
    [mutation, debounceMs]
  )

  // Debounced mutateAsync
  const debouncedMutateAsync = useCallback(
    (sprintId: string, taskIds: string[]) => {
      return new Promise<ReorderResponse>((resolve, reject) => {
        const payload: ReorderPayload = { taskIds }

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(async () => {
          try {
            const result = await mutation.mutateAsync({ sprintId, payload })
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }, debounceMs)
      })
    },
    [mutation, debounceMs]
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    mutate: debouncedMutate,
    mutateAsync: debouncedMutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  }
}
