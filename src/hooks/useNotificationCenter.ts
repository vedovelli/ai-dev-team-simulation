import { useQueries, useQueryClient } from '@tanstack/react-query'
import type { Notification, NotificationEventType } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { useNotifications, type UseNotificationsOptions, notificationQueryKeys } from './useNotifications'
import { useNotificationPreferences, type UseNotificationPreferencesOptions } from './useNotificationPreferences'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Configuration options for useNotificationCenter hook
 */
export interface UseNotificationCenterOptions {
  /** Options for the underlying notifications hook */
  notificationsOptions?: UseNotificationsOptions
  /** Options for the underlying preferences hook */
  preferencesOptions?: UseNotificationPreferencesOptions
  /** Notification types to subscribe to (filter by type) */
  subscribedTypes?: NotificationEventType[]
}

/**
 * Response types for batch operations
 */
interface MarkAllAsReadResponse {
  success: boolean
  markedCount: number
}

interface DismissMultipleResponse {
  success: boolean
  dismissedCount: number
}

interface ClearAllResponse {
  success: boolean
  clearedCount: number
}

/**
 * Check if a notification type is enabled in user preferences
 * Note: This function assumes preferences is already defined (checked by caller)
 */
function isNotificationTypeEnabled(
  notificationType: string,
  preferences: NotificationPreferences,
): boolean {
  // Get the preference object for this notification type
  const preference = (preferences as any)[notificationType]

  // If preference exists and is an object with enabled property, use it
  if (preference && typeof preference === 'object' && 'enabled' in preference) {
    return preference.enabled
  }

  // Fallback: treat missing preferences as enabled
  return true
}

/**
 * Filter notifications based on user's enabled preference types
 */
function filterNotificationsByPreferences(
  notifications: Notification[],
  preferences: NotificationPreferences | undefined,
): Notification[] {
  if (!preferences) return notifications

  return notifications.filter((notification) => {
    // Use eventType if available (structured events), otherwise fall back to type
    const notificationType = notification.eventType || notification.type
    return isNotificationTypeEnabled(notificationType, preferences)
  })
}

/**
 * Compute unread count for notifications of enabled types only
 */
function computeUnreadCountForEnabledTypes(
  notifications: Notification[],
  preferences: NotificationPreferences | undefined,
): number {
  if (!preferences) return notifications.filter((n) => !n.read).length

  return filterNotificationsByPreferences(notifications, preferences).filter((n) => !n.read).length
}

/**
 * Type guard to validate notification event type
 */
function isValidEventType(value: unknown): value is NotificationEventType {
  const validTypes: NotificationEventType[] = [
    'assignment_changed',
    'sprint_updated',
    'task_reassigned',
    'deadline_approaching',
  ]
  return validTypes.includes(value as NotificationEventType)
}

/**
 * Filter notifications by type subscription
 */
function filterNotificationsByType(
  notifications: Notification[],
  subscribedTypes?: NotificationEventType[],
): Notification[] {
  if (!subscribedTypes || subscribedTypes.length === 0) {
    return notifications
  }

  return notifications.filter((notification) => {
    const notificationType = notification.eventType || notification.type
    // Use type guard instead of unsafe cast
    return isValidEventType(notificationType) && subscribedTypes.includes(notificationType)
  })
}

/**
 * Higher-order hook that orchestrates notifications and preferences for a complete notification center experience
 *
 * Features:
 * - Uses TanStack Query's useQueries for parallel read operations
 * - Client-side filtering of notifications based on enabled preference types
 * - Unread count reflects only enabled notification types
 * - Preference changes immediately recompute filtered list without server round-trip
 * - Coordinates cache invalidation between the two underlying systems
 * - Exposes mark-as-read mutations via delegation
 * - Batch operations: markAllAsRead(), dismissMultiple(ids), clearAll()
 * - Type subscription support for filtering notifications
 *
 * Query Keys:
 * - Wraps ['notifications'] and ['notification-preferences'] from underlying hooks
 * - Derived state computed via client-side filtering
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead, preferences, markAllAsRead } = useNotificationCenter()
 *
 * // notifications are automatically filtered by user's preferences
 * // unreadCount only includes unread notifications of enabled types
 * // markAsRead delegates to the underlying mutations
 * // markAllAsRead marks all filtered notifications as read
 * ```
 */
export function useNotificationCenter(options: UseNotificationCenterOptions = {}) {
  const { notificationsOptions = {}, preferencesOptions = {}, subscribedTypes } = options
  const queryClient = useQueryClient()

  // Fetch notifications with infinite scroll support
  const notificationsHook = useNotifications(notificationsOptions)

  // Fetch and manage notification preferences
  const preferencesHook = useNotificationPreferences(preferencesOptions)

  // Get all notifications from the hook
  const allNotifications = notificationsHook.notifications || []

  // Get current preferences
  const preferences = preferencesHook.preferences

  // Filter by enabled types first
  let filteredNotifications = filterNotificationsByPreferences(allNotifications, preferences)

  // Then filter by subscription type if specified
  filteredNotifications = filterNotificationsByType(filteredNotifications, subscribedTypes)

  // Compute unread count for enabled types only
  const filteredUnreadCount = filteredNotifications.filter((n) => !n.read).length

  /**
   * Wrapper around markAsRead that can recompute filtered notifications
   */
  const markAsRead = (id: string) => {
    // Delegate to underlying mutation
    notificationsHook.markAsRead(id)
  }

  /**
   * Wrapper around markMultipleAsRead that can recompute filtered notifications
   */
  const markMultipleAsRead = async (ids: string[]) => {
    // Delegate to underlying mutation
    return notificationsHook.markMultipleAsRead(ids)
  }

  /**
   * Mark all filtered notifications as read
   */
  const markAllAsRead = async () => {
    const unreadIds = filteredNotifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) {
      return { success: true, markedCount: 0 }
    }
    await markMultipleAsRead(unreadIds)
    return { success: true, markedCount: unreadIds.length }
  }

  /**
   * Mutation for dismissing multiple notifications
   */
  const dismissMultipleMutation = useMutationWithRetry<DismissMultipleResponse, { ids: string[] }>({
    mutationFn: async ({ ids }) => {
      const response = await fetch('/api/notifications/dismiss-multiple', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss notifications: ${response.statusText}`)
      }

      return { success: true, dismissedCount: ids.length }
    },
    onMutate: async ({ ids }) => {
      // Cancel any pending notification queries
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ pages: any[] }>({
        queryKey: notificationQueryKeys.list(false),
      })

      // Optimistically remove dismissed notifications
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.filter((n: Notification) => !ids.includes(n.id)),
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(notificationQueryKeys.list(false), context.previousData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all, refetchType: 'active' })
    },
  })

  /**
   * Dismiss multiple notifications
   */
  const dismissMultiple = (ids: string[]) => {
    dismissMultipleMutation.mutate({ ids })
  }

  /**
   * Mutation for clearing all notifications
   */
  const clearAllMutation = useMutationWithRetry<ClearAllResponse, {}>({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to clear all notifications: ${response.statusText}`)
      }

      return { success: true, clearedCount: allNotifications.length }
    },
    onMutate: async () => {
      // Cancel any pending notification queries
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ pages: any[] }>({
        queryKey: notificationQueryKeys.list(false),
      })

      // Optimistically clear all notifications (just clear items, don't modify unreadCount)
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: [],
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(notificationQueryKeys.list(false), context.previousData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all, refetchType: 'active' })
    },
  })

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    clearAllMutation.mutate({})
  }

  return {
    // Filtered notifications (only types enabled in preferences + subscribed types)
    notifications: filteredNotifications,

    // Unread count for enabled types only
    unreadCount: filteredUnreadCount,

    // User's notification preferences
    preferences,

    // Query state from underlying hooks
    isLoading: notificationsHook.isLoading || preferencesHook.isLoading,
    isError: notificationsHook.isError || preferencesHook.isError,
    error: notificationsHook.error || preferencesHook.error,

    // Preference loading state
    preferencesLoading: preferencesHook.isLoading,
    preferencesError: preferencesHook.error,

    // Mutation states from notifications hook
    markAsReadLoading: notificationsHook.markAsReadLoading,
    markAsReadError: notificationsHook.markAsReadError,
    dismissLoading: notificationsHook.dismissLoading,
    dismissError: notificationsHook.dismissError,

    // Batch operation states
    dismissMultipleLoading: dismissMultipleMutation.isLoading,
    dismissMultipleError: dismissMultipleMutation.error,
    clearAllLoading: clearAllMutation.isLoading,
    clearAllError: clearAllMutation.error,

    // Preference update state
    isUpdatingPreferences: preferencesHook.isUpdating,
    updatePreferencesError: preferencesHook.updateError,

    // Actions from notifications hook (delegated)
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    dismissNotification: notificationsHook.dismissNotification,
    dismissMultiple,
    dismissAllReadNotifications: notificationsHook.dismissAllReadNotifications,
    clearAll,

    // Actions from preferences hook
    updatePreferences: preferencesHook.updatePreferences,
    resetPreferences: preferencesHook.resetPreferences,

    // Infinite scroll support
    fetchNextPage: notificationsHook.fetchNextPage,
    hasNextPage: notificationsHook.hasNextPage,
    isFetchingNextPage: notificationsHook.isFetchingNextPage,

    // Raw unfiltered data (advanced use case)
    allNotifications,
    allUnreadCount: notificationsHook.unreadCount,

    // Total count of filtered notifications
    total: filteredNotifications.length,
  }
}

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>
