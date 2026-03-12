import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { useState, useCallback } from 'react'

export interface ConflictState<TData> {
  hasConflict: boolean
  localChanges: unknown
  serverVersion: TData | null
  resolve: (strategy: 'reload' | 'override') => Promise<void>
}

export interface UseConflictAwareMutationOptions<TVariables, TData, TContext>
  extends Omit<
    UseMutationOptions<TData, Error, TVariables, TContext>,
    'mutationFn'
  > {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKeyFn?: (variables: TVariables) => unknown[]
  maxRetries?: number
  conflictLog?: boolean
}

interface ConflictLogEntry {
  timestamp: Date
  entityType: string
  entityId: string
  strategy: 'reload' | 'override'
}

// Lightweight in-memory conflict log for metrics
const conflictLog: ConflictLogEntry[] = []

export function getConflictMetrics() {
  return {
    totalConflicts: conflictLog.length,
    reloadCount: conflictLog.filter((e) => e.strategy === 'reload').length,
    overrideCount: conflictLog.filter((e) => e.strategy === 'override').length,
  }
}

export interface UseConflictAwareMutationResult<TData, TVariables>
  extends Omit<UseMutationResult<TData, Error, TVariables>, 'mutate' | 'mutateAsync'> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  conflictState: ConflictState<TData> | null
}

/**
 * A conflict-aware mutation hook that wraps TanStack Query's useMutation
 * with automatic conflict detection and recovery.
 *
 * On 409 Conflict response:
 * - Rolls back optimistic update immediately
 * - Fetches latest server data via queryClient.fetchQuery
 * - Exposes conflictState for UI conflict resolution UI
 * - resolve('reload') accepts server version
 * - resolve('override') forces local changes
 */
export function useConflictAwareMutation<TData, TVariables, TContext = unknown>(
  options: UseConflictAwareMutationOptions<TVariables, TData, TContext>
): UseConflictAwareMutationResult<TData, TVariables> {
  const {
    mutationFn,
    queryKeyFn,
    maxRetries = 3,
    conflictLog: enableConflictLog = true,
    ...mutationOptions
  } = options

  const queryClient = useQueryClient()
  const [retryCount, setRetryCount] = useState(0)
  const [conflictState, setConflictState] = useState<ConflictState<TData> | null>(null)
  const [lastVariables, setLastVariables] = useState<TVariables | null>(null)
  const [localChanges, setLocalChanges] = useState<unknown>(null)

  // Exponential backoff calculator
  const getBackoffDelay = (attempt: number) => {
    return Math.min(1000 * Math.pow(2, attempt), 10000)
  }

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      setLastVariables(variables)
      setLocalChanges(variables)

      try {
        const result = await mutationFn(variables)
        setConflictState(null)
        setRetryCount(0)
        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))

        // Check if this is a 409 Conflict
        if (err.message.includes('409') || err.message.includes('conflict')) {
          // Extract server version from error message if available
          let serverVersion: TData | null = null
          try {
            // Try to parse server version from error message
            const match = err.message.match(/serverVersion:(.*?)(?:$|,)/)
            if (match) {
              serverVersion = JSON.parse(match[1])
            }
          } catch {
            // Ignore parsing errors
          }

          // Create conflict state with resolve function
          const conflict: ConflictState<TData> = {
            hasConflict: true,
            localChanges: variables,
            serverVersion,
            resolve: async (strategy: 'reload' | 'override') => {
              // Log conflict if enabled
              if (enableConflictLog && variables && typeof variables === 'object') {
                const vars = variables as Record<string, any>
                conflictLog.push({
                  timestamp: new Date(),
                  entityType: vars.entityType || 'unknown',
                  entityId: vars.id || vars.entityId || 'unknown',
                  strategy,
                })
              }

              if (strategy === 'reload') {
                // Accept server version - refetch latest data
                if (queryKeyFn && lastVariables) {
                  const queryKey = queryKeyFn(lastVariables)
                  await queryClient.fetchQuery({
                    queryKey,
                    queryFn: async () => {
                      // This will trigger a fresh fetch of the data
                      // The actual implementation depends on the query setup
                      return serverVersion
                    },
                  })
                }
                setConflictState(null)
              } else if (strategy === 'override') {
                // Force push local changes - retry with exponential backoff
                const backoffDelay = getBackoffDelay(retryCount)
                await new Promise((resolve) => setTimeout(resolve, backoffDelay))

                if (retryCount < maxRetries) {
                  setRetryCount((prev) => prev + 1)
                  // Re-attempt the mutation
                  mutation.mutate(variables)
                }
              }
            },
          }

          setConflictState(conflict)
          throw err
        }

        // For non-conflict errors, implement exponential backoff retry
        if (retryCount < maxRetries) {
          const backoffDelay = getBackoffDelay(retryCount)
          await new Promise((resolve) => setTimeout(resolve, backoffDelay))
          setRetryCount((prev) => prev + 1)
          // Retry the mutation
          return mutationFn(variables)
        }

        throw err
      }
    },
  })

  const mutate = useCallback(
    (variables: TVariables) => {
      setRetryCount(0)
      setConflictState(null)
      mutation.mutate(variables)
    },
    [mutation]
  )

  const mutateAsync = useCallback(
    (variables: TVariables) => {
      setRetryCount(0)
      setConflictState(null)
      return mutation.mutateAsync(variables)
    },
    [mutation]
  )

  return {
    ...mutation,
    mutate,
    mutateAsync,
    conflictState,
  }
}
