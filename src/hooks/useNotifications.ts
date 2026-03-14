import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { Notification, NotificationCenter, PaginatedNotificationsResponse } from '../types/notification'
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
 * Fetch real-time notifications with infinite scroll and provide mutations for interaction
 *
 * Features:
 * - Cursor-based pagination for unbounded notification lists
 * - Automatic polling every 30 seconds on first page only (configurable)
 * - Refetch on window focus for fresh data on first page
 * - Stale-while-revalidate strategy: 30s stale, 2min gc
 * - Unread count computed from all loaded pages
 * - Mark-as-read mutation with optimistic updates across all pages
 * - Support for filtering by unread status
 * - Exponential backoff retry logic
 * - Expose fetchNextPage, hasNextPage, isFetchingNextPage for infinite scroll
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
    unreadOnly = false,
  } = options

  const queryClient = useQueryClient()

  // Infinite query to fetch notifications with cursor-based pagination
  const query = useInfiniteQuery<PaginatedNotificationsResponse, Error>({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.append('limit', '10')

      if (pageParam) {
        params.append('cursor', pageParam)
      }

      if (unreadOnly) {
        params.append('unread', 'true')
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      return response.json() as Promise<PaginatedNotificationsResponse>
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes (was cacheTime in v4)
    refetchInterval: (query) => {
      // Only poll first page for fresh notifications
      const isFirstPage = !query.state.variables?.pageParam
      return isFirstPage ? refetchInterval : false
    },
    refetchOnWindowFocus: 'stale',
    refetchOnReconnect: 'stale',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

      // Snapshot previous data across all pages
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: ['notifications', { unreadOnly: false }] }
      )

      // Optimistically update notification cache across all pages
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.map((notif) =>
              notif.id === id ? { ...notif, read: true } : notif
            ),
          })),
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(['notifications', { unreadOnly: true }], (old?: any) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PaginatedNotificationsResponse) => ({
              ...page,
              items: page.items.filter((notif: Notification) => notif.id !== id),
            })),
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
      // Refetch first page to get updated unread count
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      })
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

      // Snapshot previous data across all pages
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: ['notifications', { unreadOnly: false }] }
      )

      // Optimistically remove notification from cache across all pages
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => {
            const itemIndex = page.items.findIndex((n) => n.id === id)
            if (itemIndex !== -1) {
              return {
                ...page,
                items: page.items.filter((n) => n.id !== id),
              }
            }
            return page
          }),
        }
        queryClient.setQueryData(['notifications', { unreadOnly: false }], updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(['notifications', { unreadOnly: true }], (old?: any) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PaginatedNotificationsResponse) => ({
              ...page,
              items: page.items.filter((n: Notification) => n.id !== id),
            })),
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
      // Refetch first page to get updated unread count
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      })
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

      // Snapshot previous data across all pages
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: ['notifications', { unreadOnly: false }] }
      )

      // Optimistically remove all read notifications across all pages
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.filter((n) => !n.read),
          })),
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
      // Refetch first page to get updated unread count
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      })
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

  // Flatten all notifications from all pages
  const allNotifications = query.data?.pages.flatMap((page) => page.items) ?? []

  // Compute unread count from first page (all pages have same unreadCount)
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0

  return {
    // Query state
    ...query,

    // Computed values for backward compatibility
    notifications: allNotifications,
    unreadCount,
    total: allNotifications.length,

    // Infinite scroll methods
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,

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
