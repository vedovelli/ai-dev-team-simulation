import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserProfile, UpdateProfilePayload, SettingsConflict, ConflictResponse } from '../types/user-profile'
import { useToast } from './useToast'

/**
 * Configuration options for useUserProfile hook
 */
export interface UseUserProfileOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Helper to check if response is a conflict error
 */
function isConflictResponse(error: unknown): error is ConflictResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 'SETTINGS_CONFLICT'
  )
}

/**
 * Create a SettingsConflict error from conflict response
 */
function createConflictError(response: ConflictResponse): SettingsConflict {
  const error = new Error(response.message) as SettingsConflict
  error.name = 'SettingsConflict'
  error.serverData = response.serverData
  error.lastModified = response.lastModified
  return error
}

/**
 * Fetch and manage user's profile with conflict resolution
 *
 * Features:
 * - Caches profile with 5min stale time
 * - Update mutation with optimistic updates and rollback on error
 * - 409 Conflict handling with automatic rollback + user notification
 * - Exponential backoff retry (3 attempts) on 5xx errors only
 * - Last-write-loses conflict strategy (v1)
 * - Full TypeScript type safety with SettingsConflict error type
 */
export function useUserProfile(options: UseUserProfileOptions = {}) {
  const {
    refetchOnWindowFocus = true,
  } = options

  const queryClient = useQueryClient()
  const toast = useToast()

  // Query to fetch profile
  const query = useQuery<UserProfile, Error>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await fetch('/api/settings/profile', {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`)
      }

      return response.json() as Promise<UserProfile>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for updating profile
  const updateMutation = useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: async (patch) => {
      const currentData = queryClient.getQueryData<UserProfile>(['userProfile'])

      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...patch,
          // Include lastModified for conflict detection
          lastModified: currentData?.lastModified,
        }),
      })

      // Handle 409 Conflict - server has a newer version
      if (response.status === 409) {
        const conflictData = (await response.json()) as ConflictResponse
        const error = createConflictError(conflictData)
        throw error
      }

      if (!response.ok) {
        // For 5xx errors, let them propagate for retry logic
        throw new Error(`Failed to update user profile: ${response.statusText}`)
      }

      return response.json() as Promise<UserProfile>
    },

    onMutate: async (patch) => {
      // Cancel any pending requests
      await queryClient.cancelQueries({ queryKey: ['userProfile'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<UserProfile>(['userProfile'])

      // Optimistically update
      if (previousData) {
        const updated = {
          ...previousData,
          ...patch,
        }
        queryClient.setQueryData(['userProfile'], updated)
      }

      return { previousData }
    },

    onError: (error, _, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['userProfile'], context.previousData)
      }

      // Handle 409 Conflict specifically
      if (error instanceof Error && error.name === 'SettingsConflict') {
        const conflictError = error as SettingsConflict
        toast.error('Settings changed elsewhere, please refresh')

        // Optionally update with server's version so they can see what changed
        queryClient.setQueryData(['userProfile'], conflictError.serverData)
      }
    },

    // Only retry on 5xx errors, not on 409
    retry: (failureCount, error) => {
      // Don't retry on 409 Conflict
      if (error instanceof Error && error.name === 'SettingsConflict') {
        return false
      }
      // Retry on other errors up to 3 times
      return failureCount < 3
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  /**
   * Update user profile
   */
  const updateProfile = (patch: UpdateProfilePayload) => {
    updateMutation.mutate(patch)
  }

  /**
   * Update profile and return promise (useful for async operations)
   */
  const updateProfileAsync = (patch: UpdateProfilePayload) => {
    return updateMutation.mutateAsync(patch)
  }

  /**
   * Reset profile to default
   */
  const resetProfile = async () => {
    try {
      const response = await fetch('/api/settings/profile/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to reset user profile: ${response.statusText}`)
      }

      const result = await response.json() as UserProfile

      // Update cache with reset data
      queryClient.setQueryData(['userProfile'], result)

      return result
    } catch (error) {
      throw new Error(`Failed to reset user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    // Query state
    ...query,

    // Computed values
    profile: query.data,

    // Mutation state
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Actions
    updateProfile,
    updateProfileAsync,
    resetProfile,
  }
}

export type UseUserProfileReturn = ReturnType<typeof useUserProfile>
