import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificationPreferences, UpdatePreferencesRequest } from '../types/notification-preferences'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Configuration options for useNotificationPreferences hook
 */
export interface UseNotificationPreferencesOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Fetch and manage user's notification preferences
 *
 * Features:
 * - Caches preferences with 5min stale time
 * - Update mutation with optimistic updates
 * - Automatic cache invalidation of notifications after update
 * - Error handling and rollback on failed updates
 * - Exponential backoff retry logic
 */
export function useNotificationPreferences(options: UseNotificationPreferencesOptions = {}) {
  const {
    refetchOnWindowFocus = true,
  } = options

  const queryClient = useQueryClient()

  // Query to fetch preferences
  const query = useQuery<NotificationPreferences, Error>({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const response = await fetch('/api/notification-preferences', {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notification preferences: ${response.statusText}`)
      }

      return response.json() as Promise<NotificationPreferences>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for updating preferences
  const updateMutation = useMutationWithRetry<NotificationPreferences, UpdatePreferencesRequest>({
    mutationFn: async (patch) => {
      const response = await fetch('/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!response.ok) {
        throw new Error(`Failed to update notification preferences: ${response.statusText}`)
      }

      return response.json() as Promise<NotificationPreferences>
    },
    onMutate: async (patch) => {
      // Cancel any pending requests
      await queryClient.cancelQueries({ queryKey: ['notificationPreferences'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationPreferences>(['notificationPreferences'])

      // Optimistically update
      if (previousData) {
        const updated = {
          ...previousData,
          ...patch,
        }
        queryClient.setQueryData(['notificationPreferences'], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notificationPreferences'], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate notifications query since preferences may affect what's shown
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  /**
   * Update notification preferences
   */
  const updatePreferences = (patch: UpdatePreferencesRequest) => {
    updateMutation.mutate(patch)
  }

  /**
   * Reset all preferences to default
   */
  const resetPreferences = async () => {
    try {
      const response = await fetch('/api/notification-preferences/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to reset notification preferences: ${response.statusText}`)
      }

      const result = await response.json() as NotificationPreferences

      // Update cache with reset data
      queryClient.setQueryData(['notificationPreferences'], result)

      return result
    } catch (error) {
      throw new Error(`Failed to reset notification preferences: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    // Query state
    ...query,

    // Computed values
    preferences: query.data,

    // Mutation state
    isUpdating: updateMutation.isLoading,
    updateError: updateMutation.error,

    // Actions
    updatePreferences,
    resetPreferences,
  }
}

export type UseNotificationPreferencesReturn = ReturnType<typeof useNotificationPreferences>
