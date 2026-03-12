import { useInfiniteQuery } from '@tanstack/react-query'
import type { ActivityEvent, ActivityFeedResponse, EntityType } from '../types/activity'
import { queryKeys } from '../lib/queryKeys'

interface UseActivityFeedOptions {
  sprintId?: string
  entityType?: EntityType
  entityId?: string
  limit?: number
  pollingInterval?: number
}

/**
 * Custom hook for fetching paginated activity feed with cursor-based navigation.
 *
 * Features:
 * - Cursor-based pagination via useInfiniteQuery
 * - Auto-polling at configurable interval (default: 30s)
 * - Refetch on window focus
 * - Selective cache invalidation per entity
 * - Stale-while-revalidate: 15s stale time, 2min gc time
 *
 * Query Key Structure:
 * ```
 * ['activity', 'feeds', { entityType, entityId }]
 * ```
 *
 * Cache Invalidation:
 * ```typescript
 * // Invalidate only sprint-level activities
 * queryClient.invalidateQueries({
 *   queryKey: queryKeys.activity.feed('sprint', sprintId)
 * })
 *
 * // Invalidate all activity feeds
 * queryClient.invalidateQueries({
 *   queryKey: queryKeys.activity.all
 * })
 * ```
 *
 * @param options - Configuration options
 * @param options.sprintId - Sprint ID to filter activities (sets entityType='sprint')
 * @param options.entityType - Entity type filter: 'sprint' | 'task' | 'agent'
 * @param options.entityId - Entity ID to filter activities
 * @param options.limit - Number of events per page (default: 50)
 * @param options.pollingInterval - Polling interval in ms (default: 30000 / 30s)
 * @returns InfiniteQuery result with paginated events
 *
 * @example
 * ```tsx
 * // Fetch activities for a specific sprint
 * const { data, fetchNextPage, hasNextPage, isLoading } = useActivityFeed({
 *   sprintId: 'sprint-123',
 *   limit: 50
 * })
 *
 * // Fetch task-specific activities
 * const taskFeed = useActivityFeed({
 *   entityType: 'task',
 *   entityId: 'task-456'
 * })
 *
 * // Render events with infinite scroll
 * return (
 *   <div>
 *     {data?.pages.map(page =>
 *       page.events.map(event => <ActivityItem key={event.id} event={event} />)
 *     )}
 *     <button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
 *       Load more
 *     </button>
 *   </div>
 * )
 * ```
 */
export function useActivityFeed({
  sprintId,
  entityType,
  entityId,
  limit = 50,
  pollingInterval = 30000, // 30s default
}: UseActivityFeedOptions = {}) {
  // Use sprint as entity if sprintId provided
  const resolvedEntityType = sprintId ? 'sprint' : entityType
  const resolvedEntityId = sprintId || entityId

  return useInfiniteQuery({
    queryKey: queryKeys.activity.feed(resolvedEntityType, resolvedEntityId),
    queryFn: async ({ pageParam = null }) => {
      const url = new URL('/api/activity', window.location.origin)

      // Add filter parameters
      if (resolvedEntityType) {
        url.searchParams.set('entityType', resolvedEntityType)
      }
      if (resolvedEntityId) {
        url.searchParams.set('entityId', resolvedEntityId)
      }

      // Add pagination
      url.searchParams.set('limit', limit.toString())
      if (pageParam) {
        url.searchParams.set('cursor', pageParam)
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed')
      }

      const data = (await response.json()) as ActivityFeedResponse
      return data
    },

    // Cursor-based pagination
    getNextPageParam: (lastPage) => lastPage.nextCursor,

    // Cache strategy
    staleTime: 15000, // 15s - feeds go stale quickly
    gcTime: 2 * 60 * 1000, // 2 minutes

    // Auto-polling
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}
