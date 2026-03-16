import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications, notificationQueryKeys } from './useNotifications'
import { useNotificationPreferences } from './useNotificationPreferences'
import type { Notification, PaginatedNotificationsResponse } from '../types/notification'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Type definition for infinite query state structure
 * Matches the structure of useInfiniteQuery pages array
 */
interface InfiniteQueryState {
  pages: PaginatedNotificationsResponse[]
}

/**
 * Orchestrates notification center state and actions
 *
 * Combines useNotifications and useNotificationPreferences into a cohesive interface
 * for the notification center UI. Manages local dropdown open/close state and
 * provides unified mutation operations with proper cache invalidation.
 *
 * Features:
 * - Manages dropdown open/close state locally (not persisted in TanStack Query)
 * - Reactive unread count updates as notifications change
 * - markAllAsRead invalidates both notifications and preferences queries
 * - clearAll performs optimistic remove with rollback on error
 * - Proper cache synchronization across related queries
 * - Exposes refetch for retry capability on error
 * - Returns only UI-relevant properties to avoid confusion
 */
export function useNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  // Data layer hooks
  const notifications = useNotifications()
  const preferences = useNotificationPreferences()

  // Mutation for marking all as read
  const markAllAsReadMutation = useMutationWithRetry<{ success: boolean }, void>({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`)
      }

      return response.json() as Promise<{ success: boolean }>
    },
    onMutate: async () => {
      // Cancel pending notification requests
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data with proper typing
      const previousData = queryClient.getQueryData<InfiniteQueryState>({
        queryKey: notificationQueryKeys.list(false),
      })

      // Optimistically mark all as read across all pages
      if (previousData?.pages) {
        const updated: InfiniteQueryState = {
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.map((notif) => ({
              ...notif,
              read: true,
            })),
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)

        // Also update unreadOnly query
        queryClient.setQueryData(notificationQueryKeys.list(true), (old?: InfiniteQueryState) => {
          if (!old?.pages) return old
          return {
            pages: old.pages.map((page) => ({
              ...page,
              items: [],
            })),
          }
        })
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(notificationQueryKeys.list(false), context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate both queries to keep counts in sync
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })

  // Mutation for clearing all (dismissing all read notifications)
  const clearAllMutation = useMutationWithRetry<{ success: boolean; deletedCount: number }, void>({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to clear notifications: ${response.statusText}`)
      }

      return response.json() as Promise<{ success: boolean; deletedCount: number }>
    },
    onMutate: async () => {
      // Cancel pending notification requests
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data with proper typing
      const previousData = queryClient.getQueryData<InfiniteQueryState>({
        queryKey: notificationQueryKeys.list(false),
      })

      // Optimistically remove all read notifications across all pages
      if (previousData?.pages) {
        const updated: InfiniteQueryState = {
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.filter((notif) => !notif.read),
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert optimistic updates on error
      if (context?.previousData) {
        queryClient.setQueryData(notificationQueryKeys.list(false), context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate to refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  /**
   * Toggle dropdown open/close state
   */
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  /**
   * Close dropdown
   */
  const closeDropdown = useCallback(() => {
    setIsOpen(false)
  }, [])

  /**
   * Mark single notification as read
   */
  const markAsRead = useCallback(
    (id: string) => {
      notifications.markAsRead(id)
    },
    [notifications]
  )

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  /**
   * Clear all read notifications
   */
  const clearAll = useCallback(() => {
    clearAllMutation.mutate()
  }, [clearAllMutation])

  return {
    // UI state
    isOpen,
    toggleDropdown,
    closeDropdown,

    // Data from hooks
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,

    // Query states (UI needs to know loading/error status)
    isLoading: notifications.isLoading,
    error: notifications.error,

    // Infinite scroll
    fetchNextPage: notifications.fetchNextPage,
    hasNextPage: notifications.hasNextPage,
    isFetchingNextPage: notifications.isFetchingNextPage,

    // Mutation states
    markAsReadLoading: notifications.markAsReadLoading,
    markAllAsReadLoading: markAllAsReadMutation.isLoading,
    markAllAsReadError: markAllAsReadMutation.error,
    clearAllLoading: clearAllMutation.isLoading,
    clearAllError: clearAllMutation.error,

    // Actions
    markAsRead,
    markAllAsRead,
    clearAll,
    dismissNotification: notifications.dismissNotification,
    refetch: notifications.refetch,
  }
}

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>
