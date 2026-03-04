import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'

export interface UseOptimisticUpdateOptions<TData, TVariables, TContext = unknown>
  extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>
  /**
   * Function to compute the optimistic data based on current data and variables
   * Should return the optimistically updated data
   */
  optimisticData: (variables: TVariables, currentData: TData | undefined) => TData
  /**
   * Query key to invalidate and update on success
   */
  queryKey: (string | number | object)[]
}

interface UseOptimisticUpdateResult<TData, TVariables> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  isPending: boolean
  isError: boolean
  error: Error | null
  data: TData | null
}

/**
 * A wrapper around TanStack Query's useMutation that implements optimistic updates
 * with automatic rollback on failure.
 *
 * Usage:
 * ```tsx
 * const { mutate, isPending } = useOptimisticUpdate({
 *   mutationFn: (data) => updateUser(data),
 *   optimisticData: (variables, currentData) => ({
 *     ...currentData,
 *     ...variables,
 *   }),
 *   queryKey: ['users', userId],
 * })
 * ```
 */
export function useOptimisticUpdate<TData, TVariables, TContext = unknown>(
  options: UseOptimisticUpdateOptions<TData, TVariables, TContext>
): UseOptimisticUpdateResult<TData, TVariables> {
  const { mutationFn, optimisticData, queryKey, onError, onSuccess, ...mutationOptions } = options
  const queryClient = useQueryClient()

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic data
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous data
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update to the new data
      const newData = optimisticData(variables, previousData)
      queryClient.setQueryData(queryKey, newData)

      // Return a context with the previousData for rollback
      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback to the previous data on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      } else {
        // If we don't have previous data, just invalidate
        queryClient.invalidateQueries({ queryKey })
      }

      // Call the user's onError handler
      if (onError) {
        onError(err, variables, context)
      }
    },
    onSuccess: (data, variables, context) => {
      // Ensure the server data is reflected in the cache
      queryClient.setQueryData(queryKey, data)

      // Call the user's onSuccess handler
      if (onSuccess) {
        onSuccess(data, variables, context)
      }
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  }
}
