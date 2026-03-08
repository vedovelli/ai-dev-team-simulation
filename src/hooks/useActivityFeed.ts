import { useQuery } from '@tanstack/react-query'
import type { ActivityEvent } from '../types/activity'

interface UseActivityFeedOptions {
  limit?: number
  filter?: string
  refetchInterval?: number
}

/**
 * Custom hook for fetching real-time activity feed with auto-polling.
 *
 * Features:
 * - Auto-refetch every 10s (configurable)
 * - Stale-while-revalidate: 5s stale time, 1min gc time
 * - Returns events: task_created, task_completed, task_assigned, agent_status_change
 *
 * @param options - Configuration for polling interval, limit, and filter
 * @returns Activity feed query result with events array
 *
 * @example
 * ```tsx
 * const { data: events, isLoading } = useActivityFeed({ limit: 50 })
 * ```
 */
export function useActivityFeed({
  limit = 50,
  filter,
  refetchInterval = 10000,
}: UseActivityFeedOptions = {}) {
  return useQuery({
    queryKey: ['activity', 'feed', { limit, filter }],
    queryFn: async () => {
      const url = new URL('/api/activity/feed', window.location.origin)
      url.searchParams.set('limit', limit.toString())
      if (filter) {
        url.searchParams.set('filter', filter)
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed')
      }

      const data = await response.json()
      return data.data as ActivityEvent[]
    },

    // Stale-while-revalidate strategy
    staleTime: 5000, // 5s
    gcTime: 60000, // 1min (formerly cacheTime)

    // Auto-refetch
    refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
