import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient Configuration
 *
 * Centralizes TanStack Query configuration with:
 * - Retry logic with exponential backoff
 * - Stale-while-revalidate caching strategy
 * - Development devtools integration
 * - Error handling defaults
 */

export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale-while-revalidate: data considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Garbage collection: keep unused data for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry once on failure for queries
        retry: 1,
        // Don't refetch when user returns to window
        refetchOnWindowFocus: false,
        // Don't refetch when network reconnects
        refetchOnReconnect: false,
        // Don't refetch on mount if data already exists
        refetchOnMount: false,
      },
      mutations: {
        // Retry once on failure for mutations
        retry: 1,
      },
    },
  })
}

// Default instance for use throughout the app
export const queryClient = createQueryClient()
