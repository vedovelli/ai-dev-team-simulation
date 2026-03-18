import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Supported time range formats for filtering agent activity
 */
export type TimeRange = '7d' | '30d' | { from: Date; to: Date }

/**
 * Agent activity event representing a recorded action
 */
export interface ActivityEvent {
  id: string
  type: 'task_assigned' | 'task_completed' | 'task_status_changed' | 'task_comment' | 'assignment_changed'
  description: string
  timestamp: string
  relatedEntityId: string
}

/**
 * Paginated response for agent activity
 */
export interface PaginatedActivityResponse {
  events: ActivityEvent[]
  nextCursor: string | null
  hasMore: boolean
}

/**
 * Options for useAgentActivity hook
 */
export interface UseAgentActivityOptions {
  timeRange?: TimeRange
  pageSize?: number
}

/**
 * Query key factory for agent activity
 * Ensures consistency across all hooks that access agent activity cache
 */
export const agentActivityQueryKeys = {
  all: ['agent-activity'] as const,
  list: (agentId: string) => [...agentActivityQueryKeys.all, { agentId }] as const,
  filtered: (agentId: string, timeRange: string | { from: string; to: string }) =>
    [...agentActivityQueryKeys.list(agentId), { timeRange }] as const,
}

/**
 * Fetch agent activity events with cursor-based pagination and time-range filtering
 *
 * Features:
 * - Cursor-based pagination for efficient data fetching
 * - Time-range filtering: last 7 days, 30 days, or custom date range
 * - Stale-while-revalidate strategy: 30s stale, 5min gc
 * - Cache invalidation on assignment/task mutations
 * - Expose fetchNextPage, hasNextPage, isFetchingNextPage for infinite scroll
 * - Exponential backoff retry logic (3 attempts)
 *
 * Query Key Structure:
 * ```
 * ['agent-activity', { agentId }, { timeRange }]
 * ```
 *
 * @param agentId - The ID of the agent to fetch activity for
 * @param options - Configuration options (timeRange, pageSize)
 * @returns Agent activity state with pagination controls
 *
 * @example
 * ```tsx
 * const { events, isLoading, hasNextPage, fetchNextPage } = useAgentActivity('agent-1', {
 *   timeRange: '7d',
 *   pageSize: 20,
 * })
 *
 * return (
 *   <div>
 *     {events.map(event => (
 *       <ActivityItem key={event.id} event={event} />
 *     ))}
 *     {hasNextPage && (
 *       <button onClick={() => fetchNextPage()}>Load More</button>
 *     )}
 *   </div>
 * )
 * ```
 */
export function useAgentActivity(agentId: string, options: UseAgentActivityOptions = {}) {
  const { timeRange = '7d', pageSize = 20 } = options

  const queryClient = useQueryClient()

  // Normalize timeRange to string format for query key consistency
  const normalizedTimeRange = typeof timeRange === 'string' ? timeRange : `${timeRange.from.toISOString().split('T')[0]}_${timeRange.to.toISOString().split('T')[0]}`

  const query = useInfiniteQuery<PaginatedActivityResponse, Error>({
    queryKey: agentActivityQueryKeys.filtered(agentId, normalizedTimeRange),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.append('agentId', agentId)
      params.append('pageSize', pageSize.toString())

      // Handle timeRange parameter
      if (typeof timeRange === 'string') {
        params.append('timeRange', timeRange)
      } else {
        params.append('fromDate', timeRange.from.toISOString())
        params.append('toDate', timeRange.to.toISOString())
      }

      if (pageParam) {
        params.append('cursor', pageParam)
      }

      const response = await fetch(`/api/agents/${agentId}/activity?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agent activity: ${response.statusText}`)
      }

      return response.json() as Promise<PaginatedActivityResponse>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!agentId,
  })

  // Flatten all events from all pages
  const allEvents = query.data?.pages.flatMap((page) => page.events) ?? []

  return {
    // Query state
    ...query,

    // Computed values
    events: allEvents,
    totalCount: allEvents.length,

    // Infinite scroll methods
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}

export type UseAgentActivityReturn = ReturnType<typeof useAgentActivity>
