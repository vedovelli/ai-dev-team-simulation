import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificationPreferences, UpdateNotificationPreferencesPayload } from '../types/notification-preferences'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Fetch user notification preferences and provide mutations for updates
 *
 * Features:
 * - Fetches preferences with TanStack Query
 * - Update mutation with optimistic updates and rollback on error
 * - Cache invalidation for notifications query on successful update
 * - Query key: ['notification-preferences']
 * - Stale time: 5 minutes (preferences rarely change)
 * - Exponential backoff retry logic
 */
export function useNotificationPreferences() {
  const queryClient = useQueryClient()

  // Query to fetch current preferences
  const query = useQuery<NotificationPreferences, Error>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/notification-preferences', {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notification preferences: ${response.statusText}`)
      }

      const data = (await response.json()) as { data: NotificationPreferences; success: boolean }
      return data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for updating preferences
  const updateMutation = useMutationWithRetry<NotificationPreferences, UpdateNotificationPreferencesPayload>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to update notification preferences: ${response.statusText}`)
      }

      const data = (await response.json()) as { data: NotificationPreferences; success: boolean }
      return data.data
    },
    onMutate: async (payload) => {
      // Cancel any pending requests for preferences
      await queryClient.cancelQueries({ queryKey: ['notification-preferences'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationPreferences>(['notification-preferences'])

      // Optimistically update preferences cache
      if (previousData) {
        const optimisticData: NotificationPreferences = {
          ...previousData,
          ...payload,
          updatedAt: new Date().toISOString(),
        }
        queryClient.setQueryData(['notification-preferences'], optimisticData)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notification-preferences'], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate notifications query to ensure UI reflects preference changes
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  /**
   * Update notification preferences
   * Supports partial updates (only specified fields are updated on server)
   */
  const updatePreferences = (payload: UpdateNotificationPreferencesPayload) => {
    updateMutation.mutate(payload)
  }

  /**
   * Reset preferences to defaults
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

      const data = (await response.json()) as { data: NotificationPreferences; success: boolean }

      // Update query cache with reset data
      queryClient.setQueryData(['notification-preferences'], data.data)

      return data.data
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
