import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Notification, NotificationsResponse, NotificationType } from '../types/notification'

/**
 * Options for the useNotifications hook
 */
export interface UseNotificationsOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch (default: true) */
  refetchOnWindowFocus?: boolean
  /** Filter by notification type */
  type?: NotificationType
  /** Only fetch unread notifications (default: false) */
  unreadOnly?: boolean
  /** Pagination: page index (default: 0) */
  pageIndex?: number
  /** Pagination: page size (default: 20) */
  pageSize?: number
}

/**
 * Fetch and manage notifications with real-time polling
 *
 * Features:
 * - Automatic polling every 30 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Unread count tracking
 * - Mark as read mutation with optimistic updates
 * - Filtering by notification type
 * - Pagination support
 * - Stale-while-revalidate strategy
 *
 * @example
 * ```tsx
 * const { data, isPending, error, unreadCount, markAsRead } = useNotifications()
 *
 * if (isPending) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 *
 * return (
 *   <div>
 *     <h2>Unread: {unreadCount}</h2>
 *     {data?.map(notif => (
 *       <div key={notif.id} onClick={() => markAsRead.mutate(notif.id)}>
 *         {notif.message}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
    type,
    unreadOnly = false,
    pageIndex = 0,
    pageSize = 20,
  } = options

  const queryClient = useQueryClient()

  // Build query parameters
  const params = new URLSearchParams()
  if (type) params.append('type', type)
  if (unreadOnly) params.append('unread', 'true')
  params.append('pageIndex', pageIndex.toString())
  params.append('pageSize', pageSize.toString())

  // Fetch notifications
  const query = useQuery<NotificationsResponse, Error>({
    queryKey: ['notifications', { type, unreadOnly, pageIndex, pageSize }],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }
      return response.json() as Promise<NotificationsResponse>
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchInterval, // Polling configuration
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Mark single notification as read with optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
      }
      return response.json() as Promise<Notification>
    },
    onMutate: async (notificationId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Get current data
      const previousData = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        { type, unreadOnly, pageIndex, pageSize },
      ])

      // Optimistically update
      if (previousData) {
        const updated: NotificationsResponse = {
          ...previousData,
          data: previousData.data.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        }
        queryClient.setQueryData(
          ['notifications', { type, unreadOnly, pageIndex, pageSize }],
          updated
        )
      }

      return previousData
    },
    onError: (error, variables, context) => {
      // Revert on error
      if (context) {
        queryClient.setQueryData(
          ['notifications', { type, unreadOnly, pageIndex, pageSize }],
          context
        )
      }
    },
  })

  // Mark multiple notifications as read
  const markAsReadBatchMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await fetch('/api/notifications/read-batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds }),
      })
      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`)
      }
      return response.json() as Promise<Notification[]>
    },
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      const previousData = queryClient.getQueryData<NotificationsResponse>([
        'notifications',
        { type, unreadOnly, pageIndex, pageSize },
      ])

      if (previousData) {
        const updated: NotificationsResponse = {
          ...previousData,
          data: previousData.data.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(
            0,
            previousData.unreadCount - notificationIds.length
          ),
        }
        queryClient.setQueryData(
          ['notifications', { type, unreadOnly, pageIndex, pageSize }],
          updated
        )
      }

      return previousData
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(
          ['notifications', { type, unreadOnly, pageIndex, pageSize }],
          context
        )
      }
    },
  })

  return {
    // Query state
    data: query.data?.data || [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    error: query.error,
    isRefetching: query.isRefetching,

    // Computed values
    unreadCount: query.data?.unreadCount || 0,
    total: query.data?.total || 0,

    // Mutations
    markAsRead: {
      mutate: markAsReadMutation.mutate,
      mutateAsync: markAsReadMutation.mutateAsync,
      isPending: markAsReadMutation.isPending,
      error: markAsReadMutation.error,
    },
    markAsReadBatch: {
      mutate: markAsReadBatchMutation.mutate,
      mutateAsync: markAsReadBatchMutation.mutateAsync,
      isPending: markAsReadBatchMutation.isPending,
      error: markAsReadBatchMutation.error,
    },

    // Refetch capability
    refetch: query.refetch,
  }
}
