import { useCallback } from 'react'
import { useQueryClient, UseQueryResult } from '@tanstack/react-query'
import type { WebSocketMessage } from './useWebSocket'

export interface WebSocketQueryIntegrationOptions {
  queryKey: string[]
  onMergeData?: (existing: any, incoming: any) => any
  onInvalidate?: boolean
  onRefetch?: boolean
}

/**
 * Helper hook for integrating WebSocket realtime updates with TanStack Query.
 * Provides patterns for optimistic updates, cache invalidation, and smart merge strategies.
 *
 * @param options - Configuration for query integration
 * @returns Object with methods for cache operations
 *
 * @example
 * ```tsx
 * const { updateQueryData, invalidateQuery, refetchQuery } = useWebSocketQueryIntegration({
 *   queryKey: ['agents', 'status'],
 *   onMergeData: (existing, incoming) => ({
 *     ...existing,
 *     agents: existing.agents.map(agent =>
 *       agent.id === incoming.id ? { ...agent, status: incoming.status } : agent
 *     )
 *   })
 * })
 * ```
 */
export function useWebSocketQueryIntegration(
  options: WebSocketQueryIntegrationOptions
) {
  const { queryKey, onMergeData, onInvalidate, onRefetch } = options
  const queryClient = useQueryClient()

  /**
   * Update query cache with incoming WebSocket data.
   * Supports custom merge strategies for smart partial updates.
   */
  const updateQueryData = useCallback(
    (incoming: any) => {
      queryClient.setQueryData(queryKey, (existing: any) => {
        if (!existing) return incoming

        // If merge strategy provided, use it
        if (onMergeData) {
          return onMergeData(existing, incoming)
        }

        // Default: spread strategy for objects
        if (typeof existing === 'object' && typeof incoming === 'object') {
          return { ...existing, ...incoming }
        }

        // Fallback: replace with incoming data
        return incoming
      })
    },
    [queryClient, queryKey, onMergeData]
  )

  /**
   * Invalidate query cache to force refetch from server.
   * Useful for complex updates that require fresh data.
   */
  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  /**
   * Refetch specific query immediately.
   * Used for critical updates that need immediate visibility.
   */
  const refetchQuery = useCallback(() => {
    queryClient.refetchQueries({ queryKey })
  }, [queryClient, queryKey])

  /**
   * Get current query data from cache without triggering fetches.
   */
  const getQueryData = useCallback(() => {
    return queryClient.getQueryData(queryKey)
  }, [queryClient, queryKey])

  /**
   * Clear specific query from cache.
   */
  const clearQueryData = useCallback(() => {
    queryClient.removeQueries({ queryKey })
  }, [queryClient, queryKey])

  /**
   * Handle WebSocket message with automatic cache operations.
   * Decides between update, invalidate, or refetch based on configuration.
   */
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      if (onRefetch) {
        refetchQuery()
      } else if (onInvalidate) {
        invalidateQuery()
      } else {
        updateQueryData(message.payload)
      }
    },
    [updateQueryData, invalidateQuery, refetchQuery, onInvalidate, onRefetch]
  )

  return {
    updateQueryData,
    invalidateQuery,
    refetchQuery,
    getQueryData,
    clearQueryData,
    handleWebSocketMessage,
  }
}
