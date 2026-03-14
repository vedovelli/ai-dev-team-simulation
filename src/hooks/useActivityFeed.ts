import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ActivityEvent } from '../types/activity'
import { queryKeys } from '../lib/queryKeys'

export type TimeRange = '24h' | '7d' | '30d'
export type EventTypeFilter = 'all' | 'task' | 'sprint'

interface ActivityFeedResponse {
  data: ActivityEvent[]
  total: number
  page: number
  pageSize: number
}

interface UseActivityFeedReturn {
  activities: ActivityEvent[]
  isLoading: boolean
  isError: boolean
  page: number
  totalPages: number
  goToNextPage: () => void
  goToPrevPage: () => void
  setTimeRange: (range: TimeRange) => void
  setEventType: (type: EventTypeFilter) => void
  currentTimeRange: TimeRange
  currentEventType: EventTypeFilter
}

/**
 * Custom hook for fetching paginated activity feed with temporal and type filtering.
 *
 * Features:
 * - Page-based pagination (Next/Previous buttons)
 * - Default view: last 7 days of activity
 * - Temporal filtering: Last 24h / 7 days / 30 days
 * - Event type filtering: task events, sprint events, all events
 * - Stale-while-revalidate: 30s stale time, 5min gc time
 *
 * Query Key Structure:
 * ```
 * ['activity', { page, timeRange, eventType }]
 * ```
 *
 * @returns Activity feed state with pagination and filtering controls
 *
 * @example
 * ```tsx
 * const {
 *   activities,
 *   isLoading,
 *   page,
 *   totalPages,
 *   goToNextPage,
 *   goToPrevPage,
 *   setTimeRange,
 *   setEventType,
 *   currentTimeRange,
 *   currentEventType,
 * } = useActivityFeed()
 *
 * return (
 *   <div>
 *     <div className="filters">
 *       <select value={currentTimeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)}>
 *         <option value="24h">Last 24 hours</option>
 *         <option value="7d">Last 7 days</option>
 *         <option value="30d">Last 30 days</option>
 *       </select>
 *       <select value={currentEventType} onChange={(e) => setEventType(e.target.value as EventTypeFilter)}>
 *         <option value="all">All Events</option>
 *         <option value="task">Task Events</option>
 *         <option value="sprint">Sprint Events</option>
 *       </select>
 *     </div>
 *     {isLoading && <p>Loading...</p>}
 *     {activities.map(event => (
 *       <ActivityFeedItem key={event.id} event={event} />
 *     ))}
 *     <div className="pagination">
 *       <button onClick={goToPrevPage} disabled={page === 1}>Previous</button>
 *       <span>Page {page} of {totalPages}</span>
 *       <button onClick={goToNextPage} disabled={page >= totalPages}>Next</button>
 *     </div>
 *   </div>
 * )
 * ```
 */
export function useActivityFeed(): UseActivityFeedReturn {
  const [page, setPage] = useState(1)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [eventType, setEventType] = useState<EventTypeFilter>('all')
  const pageSize = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.activity.feed(undefined, undefined, { page, timeRange, eventType }),
    queryFn: async () => {
      const url = new URL('/api/activity', window.location.origin)
      url.searchParams.set('page', page.toString())
      url.searchParams.set('limit', pageSize.toString())
      url.searchParams.set('timeRange', timeRange)
      if (eventType !== 'all') {
        url.searchParams.set('eventType', eventType === 'task' ? 'task' : 'sprint')
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch activity feed')
      }

      return (await response.json()) as ActivityFeedResponse
    },
    staleTime: 30000, // 30s
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  return {
    activities: data?.data || [],
    isLoading,
    isError,
    page,
    totalPages,
    goToNextPage: () => setPage((p) => (p < totalPages ? p + 1 : p)),
    goToPrevPage: () => setPage((p) => (p > 1 ? p - 1 : p)),
    setTimeRange: (range: TimeRange) => {
      setTimeRange(range)
      setPage(1) // Reset to first page when filter changes
    },
    setEventType: (type: EventTypeFilter) => {
      setEventType(type)
      setPage(1) // Reset to first page when filter changes
    },
    currentTimeRange: timeRange,
    currentEventType: eventType,
  }
}
