import { useQueryClient } from '@tanstack/react-query'
import type { Notification } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { useNotifications, type UseNotificationsOptions } from './useNotifications'
import { useNotificationPreferences, type UseNotificationPreferencesOptions } from './useNotificationPreferences'

/**
 * Configuration options for useNotificationCenter hook
 */
export interface UseNotificationCenterOptions {
  /** Options for the underlying notifications hook */
  notificationsOptions?: UseNotificationsOptions
  /** Options for the underlying preferences hook */
  preferencesOptions?: UseNotificationPreferencesOptions
}

/**
 * Check if a notification type is enabled in user preferences
 */
function isNotificationTypeEnabled(
  notificationType: string,
  preferences: NotificationPreferences | undefined,
): boolean {
  if (!preferences) return false

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
  if (!preferences) return 0

  return filterNotificationsByPreferences(notifications, preferences).filter((n) => !n.read).length
}

/**
 * Higher-order hook that orchestrates notifications and preferences for a complete notification center experience
 *
 * Features:
 * - Combines useNotifications and useNotificationPreferences hooks
 * - Client-side filtering of notifications based on enabled preference types
 * - Unread count reflects only enabled notification types
 * - Preference changes immediately recompute filtered list without server round-trip
 * - Coordinates cache invalidation between the two underlying systems
 * - Exposes mark-as-read mutations via delegation
 *
 * Query Keys:
 * - Wraps ['notifications'] and ['notification-preferences'] from underlying hooks
 * - Derived state computed via client-side filtering
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead, preferences } = useNotificationCenter()
 *
 * // notifications are automatically filtered by user's preferences
 * // unreadCount only includes unread notifications of enabled types
 * // markAsRead delegates to the underlying mutations
 * ```
 */
export function useNotificationCenter(options: UseNotificationCenterOptions = {}) {
  const { notificationsOptions = {}, preferencesOptions = {} } = options

  const queryClient = useQueryClient()

  // Fetch notifications with infinite scroll support
  const notificationsHook = useNotifications(notificationsOptions)

  // Fetch and manage notification preferences
  const preferencesHook = useNotificationPreferences(preferencesOptions)

  // Get all notifications from the hook
  const allNotifications = notificationsHook.notifications || []

  // Get current preferences
  const preferences = preferencesHook.preferences

  // Filter notifications based on enabled preference types (client-side)
  const filteredNotifications = filterNotificationsByPreferences(allNotifications, preferences)

  // Compute unread count for enabled types only
  const filteredUnreadCount = computeUnreadCountForEnabledTypes(allNotifications, preferences)

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

  return {
    // Filtered notifications (only types enabled in preferences)
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

    // Preference update state
    isUpdatingPreferences: preferencesHook.isUpdating,
    updatePreferencesError: preferencesHook.updateError,

    // Actions from notifications hook (delegated)
    markAsRead,
    markMultipleAsRead,
    dismissNotification: notificationsHook.dismissNotification,
    dismissAllReadNotifications: notificationsHook.dismissAllReadNotifications,

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
