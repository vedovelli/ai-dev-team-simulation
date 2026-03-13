import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Notification, NotificationCenter } from '../types/notification'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Request/response types for dismiss operations
 */
interface DismissNotificationRequest {
  id: string
}

interface DismissAllReadRequest {
  // No parameters needed
}

interface DismissAllReadResponse {
  success: boolean
  deletedCount: number
  remaining: number
}

/**
 * Configuration options for useNotifications hook
 */
export interface UseNotificationsOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
  /** Filter to show only unread notifications (default: false) */
  unreadOnly?: boolean
}

/**
 * Mark notification as read request
 */
interface MarkAsReadRequest {
  id: string
}

/**
 * Fetch real-time notifications with polling and provide mutations for interaction
 *
 * Features:
 * - Automatic polling every 30 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy: 30s stale, 2min gc
 * - Caps notifications at 20 most recent entries
 * - Unread count computed from notification state
 * - Mark-as-read mutation with optimistic updates
 * - Support for filtering by unread status
 * - Exponential backoff retry logic
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
    unreadOnly = false,
  } = options

  const queryClient = useQueryClient()

  // Query to fetch notifications with polling
  const query = useQuery<NotificationCenter, Error>({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (unreadOnly) {
        params.append('unread', 'true')
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      const data = (await response.json()) as NotificationCenter

      // Cap notifications at 20 most recent entries
      if (data.notifications.length > 20) {
        data.notifications = data.notifications.slice(0, 20)
      }

      return data
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes (was cacheTime in v4)
    refetchInterval, // Polling configuration
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Mutation for marking a notification as read
  const markAsReadMutation = useMutationWithRetry<Notification, MarkAsReadRequest>({
    mutationFn: async ({ id }) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
      }

      return response.json() as Promise<Notification>
    },
    onMutate: async ({ id }) => {
      // Cancel any pending requests for notifications
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationCenter>(['notifications', { unreadOnly: false }])

      // Optimistically update notification cache
      if (previousData) {
        const updated = {
          ...previousData,
          notifications: previousData.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(['notifications', { unreadOnly: true }], (old?: NotificationCenter) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.filter((notif) => notif.id !== id),
            unreadCount: Math.max(0, old.unreadCount - 1),
          }
        })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  /**
   * Mark a single notification as read
   */
  const markAsRead = (id: string) => {
    markAsReadMutation.mutate({ id })
  }

  /**
   * Mark multiple notifications as read
   */
  const markMultipleAsRead = async (ids: string[]) => {
    try {
      const response = await fetch('/api/notifications/read-batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`)
      }

      const notifications = (await response.json()) as Notification[]

      // Invalidate queries after batch operation
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })

      return notifications
    } catch (error) {
      // Rethrow error with context for proper error handling
      throw new Error(`Failed to mark notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mutation for dismissing a single notification
  const dismissMutation = useMutationWithRetry<Notification, DismissNotificationRequest>({
    mutationFn: async ({ id }) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss notification: ${response.statusText}`)
      }

      return response.json() as Promise<Notification>
    },
    onMutate: async ({ id }) => {
      // Cancel any pending requests for notifications
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationCenter>(['notifications', { unreadOnly: false }])

      // Optimistically remove notification from cache
      if (previousData) {
        const notification = previousData.notifications.find((n) => n.id === id)
        const updated = {
          ...previousData,
          notifications: previousData.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read ? Math.max(0, previousData.unreadCount - 1) : previousData.unreadCount,
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(['notifications', { unreadOnly: true }], (old?: NotificationCenter) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          }
        })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mutation for dismissing all read notifications
  const dismissAllReadMutation = useMutationWithRetry<DismissAllReadResponse, DismissAllReadRequest>({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss all read notifications: ${response.statusText}`)
      }

      return response.json() as Promise<DismissAllReadResponse>
    },
    onMutate: async () => {
      // Cancel any pending requests for notifications
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationCenter>(['notifications', { unreadOnly: false }])

      // Optimistically remove all read notifications
      if (previousData) {
        const updated = {
          ...previousData,
          notifications: previousData.notifications.filter((n) => !n.read),
          total: previousData.notifications.filter((n) => !n.read).length,
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  /**
   * Dismiss a single notification
   */
  const dismissNotification = (id: string) => {
    dismissMutation.mutate({ id })
  }

  /**
   * Dismiss all read notifications
   */
  const dismissAllReadNotifications = () => {
    dismissAllReadMutation.mutate({})
  }

  return {
    // Query state
    ...query,

    // Computed values
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    total: query.data?.total ?? 0,

    // Mutation state
    markAsReadLoading: markAsReadMutation.isLoading,
    markAsReadError: markAsReadMutation.error,
    dismissLoading: dismissMutation.isLoading,
    dismissError: dismissMutation.error,
    dismissAllReadLoading: dismissAllReadMutation.isLoading,
    dismissAllReadError: dismissAllReadMutation.error,

    // Actions
    markAsRead,
    markMultipleAsRead,
    dismissNotification,
    dismissAllReadNotifications,
  }
}

export type UseNotificationsReturn = ReturnType<typeof useNotifications>

/**
 * Mutation hook for dismissing a single notification
 * Provides optimistic updates and rollback on error
 */
export function useDismissNotification() {
  const queryClient = useQueryClient()

  return useMutationWithRetry<Notification, DismissNotificationRequest>({
    mutationFn: async ({ id }) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss notification: ${response.statusText}`)
      }

      return response.json() as Promise<Notification>
    },
    onMutate: async ({ id }) => {
      // Cancel any pending requests for notifications
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationCenter>(['notifications', { unreadOnly: false }])

      // Optimistically remove notification from cache
      if (previousData) {
        const notification = previousData.notifications.find((n) => n.id === id)
        const updated = {
          ...previousData,
          notifications: previousData.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read ? Math.max(0, previousData.unreadCount - 1) : previousData.unreadCount,
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(['notifications', { unreadOnly: true }], (old?: NotificationCenter) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
          }
        })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mutation hook for dismissing all read notifications
 * Clears all read notifications with optimistic updates
 */
export function useDismissAllNotifications() {
  const queryClient = useQueryClient()

  return useMutationWithRetry<DismissAllReadResponse, DismissAllReadRequest>({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss all read notifications: ${response.statusText}`)
      }

      return response.json() as Promise<DismissAllReadResponse>
    },
    onMutate: async () => {
      // Cancel any pending requests for notifications
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<NotificationCenter>(['notifications', { unreadOnly: false }])

      // Optimistically remove all read notifications
      if (previousData) {
        const updated = {
          ...previousData,
          notifications: previousData.notifications.filter((n) => !n.read),
          total: previousData.notifications.filter((n) => !n.read).length,
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data after successful mutation
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
