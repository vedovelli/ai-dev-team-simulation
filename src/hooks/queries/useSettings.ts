/**
 * useSettings Hook
 *
 * Fetch and manage user settings for a specific section
 *
 * Features:
 * - Fetches settings data for profile, notifications, or display sections
 * - Supports partial updates via separate mutation
 * - Stale-while-revalidate strategy
 * - Exponential backoff retry on failure
 * - Query key hierarchy: ['settings', section]
 *
 * Usage:
 * ```tsx
 * const { data: profileSettings, isLoading } = useSettings('profile')
 * const { data: displaySettings } = useSettings('display')
 * ```
 */

import { useQuery, useQueryClient, useMutation, useCallback } from '@tanstack/react-query'
import type { SettingsSection, SettingsData } from '../../types/settings'

export interface UseSettingsOptions {
  staleTime?: number
  gcTime?: number
}

export interface UseSettingsReturn<T extends SettingsData = SettingsData> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Fetch settings for a specific section
 */
export function useSettings<T extends SettingsData = SettingsData>(
  section: SettingsSection,
  options?: UseSettingsOptions
): UseSettingsReturn<T> {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch: reactQueryRefetch } = useQuery<T, Error>({
    queryKey: ['settings', section],
    queryFn: async () => {
      const response = await fetch(`/api/settings/${section}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${section} settings: ${response.statusText}`)
      }
      return response.json() as Promise<T>
    },
    staleTime: options?.staleTime ?? 30 * 1000, // 30 seconds
    gcTime: options?.gcTime ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const refetch = useCallback(async () => {
    await reactQueryRefetch()
  }, [reactQueryRefetch])

  return {
    data,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

/**
 * Update settings for a specific section
 *
 * Provides optimistic updates with automatic rollback on error
 */
export function useUpdateSettings<T extends SettingsData = SettingsData>(section: SettingsSection) {
  const queryClient = useQueryClient()

  const mutation = useMutation<T, Error, Partial<T>>({
    mutationFn: async (updates) => {
      const response = await fetch(`/api/settings/${section}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update ${section} settings: ${response.statusText}`)
      }

      return response.json() as Promise<T>
    },

    onMutate: async (updates) => {
      // Cancel any pending queries
      await queryClient.cancelQueries({ queryKey: ['settings', section] })

      // Get current data
      const previousSettings = queryClient.getQueryData<T>(['settings', section])

      // Optimistically update
      if (previousSettings) {
        const optimisticData = {
          ...previousSettings,
          ...updates,
          updatedAt: new Date().toISOString(),
        } as T
        queryClient.setQueryData(['settings', section], optimisticData)
      }

      return { previousSettings }
    },

    onError: (error, updates, context) => {
      // Rollback to previous data on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings', section], context.previousSettings)
      }
    },

    onSuccess: (data) => {
      // Ensure latest data is in cache
      queryClient.setQueryData(['settings', section], data)
    },
  })

  return mutation
}

/**
 * Invalidate settings cache for a specific section
 *
 * Useful when settings are updated from other sources or need forced refresh
 */
export function useInvalidateSettings() {
  const queryClient = useQueryClient()

  const invalidate = useCallback((section?: SettingsSection) => {
    if (section) {
      queryClient.invalidateQueries({ queryKey: ['settings', section] })
    } else {
      // Invalidate all settings sections
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  }, [queryClient])

  return { invalidate }
}
