import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'

/**
 * Options for useOptimisticMutation hook
 *
 * TData: The shape of the response data from the server
 * TVariables: The shape of the input variables for the mutation
 * TContext: The shape of the context returned from onMutate
 * TError: The shape of the error
 */
export interface UseOptimisticMutationOptions<
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /**
   * The actual mutation function to call on the server
   */
  mutationFn: (variables: TVariables) => Promise<TData>

  /**
   * Function to compute optimistic data based on current data and variables
   * Called immediately before the mutation to update the cache
   */
  optimisticUpdate: (variables: TVariables, currentData: TData | undefined) => TData

  /**
   * Query key to manage in the cache
   * Can be a full key or a partial key for batch updates
   */
  queryKey: (string | number | object)[]

  /**
   * Optional: Function to determine which queries to invalidate on success
   * If not provided, only the main queryKey is invalidated
   */
  invalidateKeys?: (data: TData, variables: TVariables) => (string | number | object)[][]
}

/**
 * Result type for useOptimisticMutation
 */
export interface UseOptimisticMutationResult<TData, TError = Error, TVariables = void> {
  mutate: (variables: TVariables, options?: { onSuccess?: (data: TData) => void; onError?: (error: TError) => void }) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  isPending: boolean
  isError: boolean
  error: TError | null
  data: TData | null
}

/**
 * A comprehensive wrapper around TanStack Query's useMutation that implements
 * optimistic updates with automatic rollback on failure.
 *
 * Key features:
 * - Immediate optimistic cache updates
 * - Automatic rollback to previous state on error
 * - Support for batch updates via query key matching
 * - Type-safe with full generic support
 * - Flexible query invalidation strategy
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useOptimisticMutation({
 *   mutationFn: (variables) => updateSprintTask(variables),
 *   optimisticUpdate: (variables, currentData) => ({
 *     ...currentData,
 *     ...variables,
 *   }),
 *   queryKey: ['sprint', sprintId, 'task', taskId],
 *   invalidateKeys: (data, variables) => [
 *     ['sprint', variables.sprintId, 'tasks'],
 *     ['sprint', variables.sprintId, 'metrics'],
 *   ],
 * })
 *
 * mutate({ sprintId: '1', taskId: '2', status: 'done' })
 * ```
 */
export function useOptimisticMutation<
  TData,
  TError = Error,
  TVariables = void,
  TContext extends { previousData?: TData } = { previousData?: TData },
>(
  options: UseOptimisticMutationOptions<TData, TError, TVariables, TContext>
): UseOptimisticMutationResult<TData, TError, TVariables> {
  const { mutationFn, optimisticUpdate, queryKey, invalidateKeys, onError, onSuccess, ...mutationOptions } = options
  const queryClient = useQueryClient()

  const mutation = useMutation<TData, TError, TVariables, { previousData?: TData }>({
    ...mutationOptions,
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any pending queries for this key to prevent race conditions
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous data for rollback
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Apply optimistic update immediately
      const optimisticData = optimisticUpdate(variables, previousData)
      queryClient.setQueryData(queryKey, optimisticData)

      // Return context for error handling and success callbacks
      return { previousData }
    },
    onError: (err, variables, context, inlineOptions) => {
      // Rollback to previous state on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      } else {
        // If we don't have previous data, invalidate the query to refetch
        queryClient.invalidateQueries({ queryKey })
      }

      // Compose error callbacks: hook-level first, then inline
      if (onError) {
        onError(err, variables, context)
      }
      // Call inline error handler if provided
      if (inlineOptions?.onError) {
        inlineOptions.onError(err)
      }
    },
    onSuccess: (data, variables, context, inlineOptions) => {
      // Ensure server data is reflected in cache
      queryClient.setQueryData(queryKey, data)

      // Invalidate related queries if invalidateKeys is provided
      if (invalidateKeys) {
        const keysToInvalidate = invalidateKeys(data, variables)
        keysToInvalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      } else {
        // Default: invalidate the main query key
        queryClient.invalidateQueries({ queryKey })
      }

      // Compose success callbacks: hook-level first, then inline
      if (onSuccess) {
        onSuccess(data, variables, context)
      }
      // Call inline success handler if provided
      if (inlineOptions?.onSuccess) {
        inlineOptions.onSuccess(data)
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
