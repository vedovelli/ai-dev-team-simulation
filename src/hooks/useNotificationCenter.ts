import { useState, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications, notificationQueryKeys } from './useNotifications'
import { useNotificationPreferences } from './useNotificationPreferences'
import type { Notification, NotificationType, PaginatedNotificationsResponse } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Type definition for infinite query state structure
 * Matches the structure of useInfiniteQuery pages array
 */
interface InfiniteQueryState {
  pages: PaginatedNotificationsResponse[]
}

/**
 * Configuration options for client-side pagination
 */
export interface NotificationCenterPaginationConfig {
  /** Current page number (1-indexed, default: 1) */
  pageNumber: number
  /** Items per page (default: 10, max: 100) */
  pageSize: number
}

/**
 * Pagination metadata for virtualization and UI control
 */
export interface NotificationCenterPagination {
  /** Current page number */
  pageNumber: number
  /** Total items per page */
  pageSize: number
  /** Total number of items across all pages */
  total: number
  /** Total number of pages */
  pageCount: number
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Whether there is a previous page */
  hasPreviousPage: boolean
}

/**
 * Orchestrates notification center state and actions
 *
 * Combines useNotifications and useNotificationPreferences into a cohesive interface
 * for the notification center UI. Provides client-side pagination and preference-based filtering.
 *
 * Features:
 * - Client-side pagination (configurable page size, default 10)
 * - Filters notifications by user preferences (enabled notification types)
 * - Manages dropdown open/close state locally
 * - Reactive unread count from all notifications
 * - markAllAsRead invalidates both notifications and preferences queries
 * - clearAll performs optimistic remove with rollback on error
 * - Proper cache synchronization across related queries
 * - TanStack Virtual compatible: returns flat list with total count
 * - Pagination controls: goToPage, nextPage, prevPage
 */
export function useNotificationCenter(config: NotificationCenterPaginationConfig = { pageNumber: 1, pageSize: 10 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(Math.max(1, config.pageNumber))
  const pageSize = Math.min(Math.max(1, config.pageSize), 100) // Clamp between 1 and 100

  const queryClient = useQueryClient()

  // Data layer hooks
  const notifications = useNotifications()
  const preferences = useNotificationPreferences()

  /**
   * Filter notifications by enabled preference types
   * Excludes only notification types explicitly disabled (frequency === 'off') in user preferences
   */
  const filteredNotifications = useMemo(() => {
    if (!notifications.notifications || !preferences.data) {
      return notifications.notifications ?? []
    }

    const prefs = preferences.data as NotificationPreferences
    const disabledTypes = new Set<NotificationType>()

    // Valid notification type keys - these correspond to actual NotificationTypePreference objects
    const notificationTypeKeys: (keyof NotificationPreferences)[] = [
      'assignment_changed',
      'sprint_updated',
      'task_reassigned',
      'deadline_approaching',
      'task_assigned',
      'task_unassigned',
      'sprint_started',
      'sprint_completed',
      'comment_added',
      'status_changed',
      'agent_event',
      'performance_alert',
    ]

    // Build set of disabled notification types from preferences
    // Only include types that have frequency === 'off'
    notificationTypeKeys.forEach((typeKey) => {
      const pref = prefs[typeKey]
      if (pref && pref.frequency === 'off') {
        // Safe cast: we know this key is a valid NotificationType
        disabledTypes.add(typeKey as NotificationType)
      }
    })

    // Filter notifications to exclude only disabled types
    // Include all others, supporting backward compatibility for new notification types
    return notifications.notifications.filter((notif) => {
      // Include notification if its type is NOT explicitly disabled
      return !disabledTypes.has(notif.type)
    })
  }, [notifications.notifications, preferences.data])

  /**
   * Calculate pagination metadata
   */
  const pagination = useMemo<NotificationCenterPagination>(() => {
    const total = filteredNotifications.length
    const pageCount = Math.ceil(total / pageSize) || 1
    const validPageNumber = Math.min(currentPage, pageCount)

    return {
      pageNumber: validPageNumber,
      pageSize,
      total,
      pageCount,
      hasNextPage: validPageNumber < pageCount,
      hasPreviousPage: validPageNumber > 1,
    }
  }, [filteredNotifications.length, pageSize, currentPage])

  /**
   * Get notifications for current page
   * TanStack Virtual compatible: returns flat list
   */
  const paginatedNotifications = useMemo(() => {
    const start = (pagination.pageNumber - 1) * pageSize
    const end = start + pageSize
    return filteredNotifications.slice(start, end)
  }, [filteredNotifications, pagination.pageNumber, pageSize])

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
   * Navigate to specific page
   */
  const goToPage = useCallback((pageNum: number) => {
    const validPage = Math.max(1, Math.min(pageNum, pagination.pageCount))
    setCurrentPage(validPage)
  }, [pagination.pageCount])

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [pagination.hasNextPage])

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [pagination.hasPreviousPage])

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
    notifications: paginatedNotifications,
    filteredNotifications,
    unreadCount: notifications.unreadCount,

    // Query states (UI needs to know loading/error status)
    isLoading: notifications.isLoading,
    error: notifications.error,
    preferencesLoading: preferences.isLoading,
    preferencesError: preferences.error,

    // Pagination
    pagination,
    goToPage,
    nextPage,
    previousPage,

    // Infinite scroll (for backward compatibility)
    fetchNextPage: notifications.fetchNextPage,
    isFetchingNextPage: notifications.isFetchingNextPage,

    // Mutation states
    markAsReadLoading: notifications.markAsReadLoading,
    markAllAsReadLoading: markAllAsReadMutation.isLoading,
    markAllAsReadError: markAllAsReadMutation.error,
    clearAllLoading: clearAllMutation.isLoading,
    clearAllError: clearAllMutation.error,

    // Actions
    markAsRead,
    markMultipleAsRead: notifications.markMultipleAsRead,
    markAllAsRead,
    clearAll,
    dismissNotification: notifications.dismissNotification,
    refetch: notifications.refetch,
  }
}

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>
