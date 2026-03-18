import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Notification, NotificationType } from '../types/notification'

/**
 * Filters for notification history query
 */
export interface NotificationHistoryFilters {
  /** Filter by notification type */
  type?: NotificationType
  /** Filter by read status */
  status?: 'read' | 'unread' | 'all'
  /** Start date for range filter (ISO 8601) */
  startDate?: string
  /** End date for range filter (ISO 8601) */
  endDate?: string
}

/**
 * Cursor-based pagination metadata for history
 */
export interface NotificationHistoryPaginationMeta {
  cursor: string | null
  nextCursor: string | null
  hasMore: boolean
  pageSize: number
}

/**
 * History entry with additional metadata
 */
export interface NotificationHistoryEntry extends Notification {
  /** When this notification was created */
  createdAt: string
  /** When this notification was read (if read) */
  readAt?: string
}

/**
 * Response structure for notification history endpoint
 */
export interface NotificationHistoryResponse {
  items: NotificationHistoryEntry[]
  pagination: NotificationHistoryPaginationMeta
  totalCount: number
  unreadCount: number
}

/**
 * Configuration options for useNotificationHistory hook
 */
export interface UseNotificationHistoryOptions {
  /** Pagination limit per page (default: 20) */
  limit?: number
  /** Filters to apply to history query */
  filters?: NotificationHistoryFilters
  /** Stale time in milliseconds (default: 5min) */
  staleTime?: number
  /** GC time in milliseconds (default: 10min) */
  gcTime?: number
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Query key factory for notification history
 * Ensures consistency across cache management
 */
export const notificationHistoryQueryKeys = {
  all: ['notifications', 'history'] as const,
  list: (filters: NotificationHistoryFilters = {}) =>
    [
      ...notificationHistoryQueryKeys.all,
      { filters },
    ] as const,
  cursor: (filters: NotificationHistoryFilters = {}, cursor: string | null = null) =>
    [
      ...notificationHistoryQueryKeys.all,
      { filters, cursor },
    ] as const,
}

/**
 * Fetch notification history with cursor-based pagination and filtering
 *
 * Features:
 * - Cursor-based pagination (efficient for large datasets)
 * - Filter by: type, read status, date range
 * - Stale-while-revalidate caching strategy
 * - Backward compatible pagination metadata
 * - TypeScript type safety with filter unions
 *
 * @example
 * const { items, pagination, totalCount, isLoading } = useNotificationHistory({
 *   limit: 20,
 *   filters: {
 *     type: 'assignment_changed',
 *     status: 'unread',
 *     startDate: '2026-03-01T00:00:00Z',
 *   },
 * })
 */
export function useNotificationHistory(options: UseNotificationHistoryOptions = {}) {
  const {
    limit = 20,
    filters = {},
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = true,
  } = options

  const queryClient = useQueryClient()

  // Build query key with filters
  const queryKey = notificationHistoryQueryKeys.list(filters)

  const query = useQuery<NotificationHistoryResponse, Error>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('limit', limit.toString())

      // Add filter parameters
      if (filters.type) {
        params.append('type', filters.type)
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }

      const response = await fetch(`/api/notifications/history?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch notification history: ${response.statusText}`
        )
      }

      return response.json() as Promise<NotificationHistoryResponse>
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: refetchOnWindowFocus ? 'stale' : false,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  /**
   * Invalidate history cache (used by mutations or explicit refresh)
   */
  const invalidateHistory = async () => {
    await queryClient.invalidateQueries({
      queryKey: notificationHistoryQueryKeys.all,
      refetchType: 'active',
    })
  }

  /**
   * Fetch specific page using cursor
   */
  const fetchPage = async (cursor: string | null) => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())

    if (cursor) {
      params.append('cursor', cursor)
    }

    // Add filter parameters
    if (filters.type) {
      params.append('type', filters.type)
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status)
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate)
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate)
    }

    const response = await fetch(`/api/notifications/history?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch notification history: ${response.statusText}`
      )
    }

    return response.json() as Promise<NotificationHistoryResponse>
  }

  return {
    // Query state
    ...query,

    // Computed values
    items: query.data?.items ?? [],
    pagination: query.data?.pagination ?? {
      cursor: null,
      nextCursor: null,
      hasMore: false,
      pageSize: limit,
    },
    totalCount: query.data?.totalCount ?? 0,
    unreadCount: query.data?.unreadCount ?? 0,

    // Actions
    invalidateHistory,
    fetchPage,
  }
}

export type UseNotificationHistoryReturn = ReturnType<
  typeof useNotificationHistory
>
