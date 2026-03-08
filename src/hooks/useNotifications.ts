import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Notification, NotificationsResponse, NotificationType } from '../types/notification'
import { useWebSocket, type WebSocketMessage } from './useWebSocket'
import { useWebSocketQueryIntegration } from './useWebSocketQueryIntegration'

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
  /** Enable WebSocket real-time updates (default: true) */
  enableWebSocket?: boolean
  /** WebSocket URL (default: ws://localhost:8080/notifications) */
  wsUrl?: string
}

/**
 * Fetch and manage notifications with real-time WebSocket support
 *
 * Features:
 * - WebSocket real-time subscription for instant updates
 * - Automatic polling every 30 seconds (configurable fallback)
 * - Refetch on window focus for fresh data
 * - WebSocket reconnection with exponential backoff
 * - Unread count tracking and aggregation
 * - Mark as read/dismiss mutations with optimistic updates
 * - Filtering by notification type
 * - Pagination support
 * - Cache invalidation triggers from WebSocket events
 * - Stale-while-revalidate strategy
 *
 * @example
 * ```tsx
 * const {
 *   data, isPending, error, unreadCount,
 *   markAsRead, dismiss, wsConnected
 * } = useNotifications({ enableWebSocket: true })
 *
 * if (isPending) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 *
 * return (
 *   <div>
 *     <h2>Unread: {unreadCount} {wsConnected && '✓ Live'}</h2>
 *     {data?.map(notif => (
 *       <div key={notif.id}>
 *         {notif.message}
 *         <button onClick={() => markAsRead.mutate(notif.id)}>Mark read</button>
 *         <button onClick={() => dismiss.mutate(notif.id)}>Dismiss</button>
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
    enableWebSocket = true,
    wsUrl = 'ws://localhost:8080/notifications',
  } = options

  const queryClient = useQueryClient()
  const queryKey = ['notifications', { type, unreadOnly, pageIndex, pageSize }]

  // Build query parameters
  const params = new URLSearchParams()
  if (type) params.append('type', type)
  if (unreadOnly) params.append('unread', 'true')
  params.append('pageIndex', pageIndex.toString())
  params.append('pageSize', pageSize.toString())

  // WebSocket integration for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    url: wsUrl,
    onMessage: (message: WebSocketMessage<Partial<Notification>>) => {
      if (!enableWebSocket) return

      // Handle different WebSocket message types
      if (message.type === 'notification:new') {
        // New notification received - invalidate to refetch
        queryClient.invalidateQueries({ queryKey })
      } else if (message.type === 'notification:updated') {
        // Update existing notification in cache
        queryClient.setQueryData(queryKey, (old: NotificationsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((n) =>
              n.id === message.payload.id ? { ...n, ...message.payload } : n
            ),
            unreadCount: old.data.some(n => n.id === message.payload.id && !n.read && message.payload.read)
              ? Math.max(0, old.unreadCount - 1)
              : old.unreadCount,
          }
        })
      } else if (message.type === 'notification:dismissed') {
        // Remove dismissed notification from cache
        queryClient.setQueryData(queryKey, (old: NotificationsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.filter((n) => n.id !== message.payload.id),
            total: Math.max(0, old.total - 1),
          }
        })
      }
    },
    shouldReconnect: enableWebSocket,
    maxReconnectAttempts: 5,
    initialReconnectDelay: 1000,
    maxReconnectDelay: 30000,
  })

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
      await queryClient.cancelQueries({ queryKey })

      // Get current data
      const previousData = queryClient.getQueryData<NotificationsResponse>(queryKey)

      // Optimistically update
      if (previousData) {
        const updated: NotificationsResponse = {
          ...previousData,
          data: previousData.data.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        }
        queryClient.setQueryData(queryKey, updated)
      }

      return previousData
    },
    onError: (error, variables, context) => {
      // Revert on error
      if (context) {
        queryClient.setQueryData(queryKey, context)
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
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<NotificationsResponse>(queryKey)

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
        queryClient.setQueryData(queryKey, updated)
      }

      return previousData
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context)
      }
    },
  })

  // Dismiss notification (removes from list)
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        throw new Error(`Failed to dismiss notification: ${response.statusText}`)
      }
      return response.json() as Promise<{ success: boolean }>
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<NotificationsResponse>(queryKey)

      // Optimistically remove from list
      if (previousData) {
        const notificationToRemove = previousData.data.find((n) => n.id === notificationId)
        const updated: NotificationsResponse = {
          ...previousData,
          data: previousData.data.filter((n) => n.id !== notificationId),
          total: Math.max(0, previousData.total - 1),
          unreadCount: notificationToRemove?.read
            ? previousData.unreadCount
            : Math.max(0, previousData.unreadCount - 1),
        }
        queryClient.setQueryData(queryKey, updated)
      }

      return previousData
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context)
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

    // WebSocket state
    wsConnected: enableWebSocket && wsConnected,

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
    dismiss: {
      mutate: dismissMutation.mutate,
      mutateAsync: dismissMutation.mutateAsync,
      isPending: dismissMutation.isPending,
      error: dismissMutation.error,
    },

    // Refetch capability
    refetch: query.refetch,
  }
}
