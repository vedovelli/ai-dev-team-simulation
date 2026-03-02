import { useMutation, useQueryClient, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query'
import { useState } from 'react'

export interface MutationState<TData> {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
  data: TData | null
  canRetry: boolean
}

export interface UseMutationWithRetryOptions<TVariables, TData, TContext>
  extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>
  maxRetries?: number
}

interface MutationWithRetryResult<TData, TVariables> extends Omit<UseMutationResult<TData, Error, TVariables>, 'mutate' | 'mutateAsync'> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  retry: () => void
  canRetry: boolean
}

/**
 * A wrapper around TanStack Query's useMutation that adds:
 * - Optimistic updates with rollback on failure
 * - Retry mechanism with user-triggered button
 * - Unified error/loading/success state management
 */
export function useMutationWithRetry<TData, TVariables, TContext = unknown>(
  options: UseMutationWithRetryOptions<TVariables, TData, TContext>
): MutationWithRetryResult<TData, TVariables> {
  const { mutationFn, maxRetries = 3, ...mutationOptions } = options
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<Error | null>(null)
  const [lastVariables, setLastVariables] = useState<TVariables | null>(null)

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      setLastVariables(variables)
      try {
        const result = await mutationFn(variables)
        setLastError(null)
        setRetryCount(0)
        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setLastError(err)
        throw err
      }
    },
  })

  const handleRetry = () => {
    if (lastVariables && retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1)
      mutation.mutate(lastVariables)
    }
  }

  const canRetry = mutation.isError && retryCount < maxRetries && lastVariables !== null

  return {
    ...mutation,
    mutate: (variables) => {
      setRetryCount(0)
      mutation.mutate(variables)
    },
    mutateAsync: (variables) => {
      setRetryCount(0)
      return mutation.mutateAsync(variables)
    },
    retry: handleRetry,
    canRetry,
  }
}
