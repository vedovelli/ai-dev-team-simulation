import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SavedFilter, SaveFilterRequest, UseSavedFiltersOptions, UseSavedFiltersReturn } from '../types/search'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Query key factory for saved filters
 */
export const savedFiltersQueryKeys = {
  all: ['search', 'saved-filters'] as const,
  list: () => [...savedFiltersQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...savedFiltersQueryKeys.all, 'detail', id] as const,
}

/**
 * CRUD hook for managing saved filter sets
 *
 * Features:
 * - Fetch all saved filter sets with caching
 * - Save new filter set (POST)
 * - Update existing filter set (PATCH)
 * - Delete filter set (DELETE)
 * - Reset all filters (POST /reset)
 * - Optimistic updates with rollback on error
 * - Exponential backoff retry logic
 *
 * @param options Configuration for saved filters behavior
 * @returns Saved filters state and mutation functions
 *
 * @example
 * ```tsx
 * const filters = useSavedFilters()
 *
 * // Save current filter set
 * const saved = await filters.saveFilter({
 *   name: 'My Filter Set',
 *   description: 'All high-priority in-progress tasks',
 *   filters: { priority: ['high'], status: ['in-progress'] },
 * })
 *
 * // Update existing filter
 * await filters.updateFilter(saved.id, { ...saved, name: 'New Name' })
 *
 * // Delete filter
 * await filters.deleteFilter(saved.id)
 *
 * // Reset all
 * await filters.resetAll()
 *
 * // Get saved filters
 * const { savedFilters, isLoading } = filters
 * ```
 */
export function useSavedFilters(options: UseSavedFiltersOptions = {}): UseSavedFiltersReturn {
  const {
    refetchOnWindowFocus = true,
  } = options

  const queryClient = useQueryClient()

  // Query to fetch saved filters
  const query = useQuery<{ filters: SavedFilter[] }, Error>({
    queryKey: savedFiltersQueryKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/search/saved-filters', {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch saved filters: ${response.statusText}`)
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mutation for saving new filter
  const saveMutation = useMutationWithRetry<SavedFilter, SaveFilterRequest>({
    mutationFn: async (request) => {
      const response = await fetch('/api/search/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to save filter: ${response.statusText}`)
      }

      return response.json()
    },
    onMutate: async (newFilter) => {
      // Cancel any pending requests
      await queryClient.cancelQueries({ queryKey: savedFiltersQueryKeys.list() })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ filters: SavedFilter[] }>(savedFiltersQueryKeys.list())

      // Optimistically add new filter
      if (previousData) {
        const tempId = `temp-${Date.now()}`
        const optimisticFilter: SavedFilter = {
          id: tempId,
          name: newFilter.name,
          description: newFilter.description,
          filters: newFilter.filters,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        queryClient.setQueryData(savedFiltersQueryKeys.list(), {
          filters: [...previousData.filters, optimisticFilter],
        })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(savedFiltersQueryKeys.list(), context.previousData)
      }
    },
    onSuccess: (savedFilter) => {
      // Update cache with actual saved filter
      const current = queryClient.getQueryData<{ filters: SavedFilter[] }>(savedFiltersQueryKeys.list())
      if (current) {
        const filtered = current.filters.filter((f) => !f.id.startsWith('temp-'))
        queryClient.setQueryData(savedFiltersQueryKeys.list(), {
          filters: [...filtered, savedFilter],
        })
      }
    },
  })

  // Mutation for updating filter
  const updateMutation = useMutationWithRetry<
    SavedFilter,
    { id: string; request: SaveFilterRequest }
  >({
    mutationFn: async ({ id, request }) => {
      const response = await fetch(`/api/search/saved-filters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to update filter: ${response.statusText}`)
      }

      return response.json()
    },
    onMutate: async ({ id, request }) => {
      // Cancel any pending requests
      await queryClient.cancelQueries({ queryKey: savedFiltersQueryKeys.list() })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ filters: SavedFilter[] }>(savedFiltersQueryKeys.list())

      // Optimistically update
      if (previousData) {
        const updated = previousData.filters.map((f) =>
          f.id === id
            ? {
                ...f,
                name: request.name,
                description: request.description,
                filters: request.filters,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
        queryClient.setQueryData(savedFiltersQueryKeys.list(), { filters: updated })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(savedFiltersQueryKeys.list(), context.previousData)
      }
    },
  })

  // Mutation for deleting filter
  const deleteMutation = useMutationWithRetry<void, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/search/saved-filters/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete filter: ${response.statusText}`)
      }
    },
    onMutate: async (id) => {
      // Cancel any pending requests
      await queryClient.cancelQueries({ queryKey: savedFiltersQueryKeys.list() })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ filters: SavedFilter[] }>(savedFiltersQueryKeys.list())

      // Optimistically remove
      if (previousData) {
        queryClient.setQueryData(savedFiltersQueryKeys.list(), {
          filters: previousData.filters.filter((f) => f.id !== id),
        })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(savedFiltersQueryKeys.list(), context.previousData)
      }
    },
  })

  // Helper to save filter
  const saveFilter = async (request: SaveFilterRequest): Promise<SavedFilter> => {
    return new Promise((resolve, reject) => {
      saveMutation.mutate(request, {
        onSuccess: (data) => resolve(data),
        onError: (err) => reject(err),
      })
    })
  }

  // Helper to update filter
  const updateFilter = async (id: string, request: SaveFilterRequest): Promise<SavedFilter> => {
    return new Promise((resolve, reject) => {
      updateMutation.mutate(
        { id, request },
        {
          onSuccess: (data) => resolve(data),
          onError: (err) => reject(err),
        }
      )
    })
  }

  // Helper to delete filter
  const deleteFilter = async (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      deleteMutation.mutate(id, {
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      })
    })
  }

  // Helper to reset all filters
  const resetAll = async (): Promise<void> => {
    try {
      const response = await fetch('/api/search/saved-filters/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to reset filters: ${response.statusText}`)
      }

      // Clear cache
      queryClient.setQueryData(savedFiltersQueryKeys.list(), { filters: [] })
    } catch (error) {
      throw new Error(`Failed to reset filters: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    // Query state
    savedFilters: query.data?.filters ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Mutation states
    isSaving: saveMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isResetting: false, // Reset is not a mutation, so we don't track it

    // Actions
    saveFilter,
    deleteFilter,
    updateFilter,
    resetAll,
  }
}

export type UseSavedFiltersReturnType = ReturnType<typeof useSavedFilters>
