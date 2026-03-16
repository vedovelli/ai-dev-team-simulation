import { useQueryClient } from '@tanstack/react-query'
import type { Notification } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { createNotificationCacheManager } from '../utils/notification-cache-manager'

/**
 * Hook that provides bound NotificationCacheManager methods
 * Accepts queryClient from useQueryClient() internally
 *
 * Usage:
 * ```
 * const { invalidateOnPreferenceChange, filterDisabledNotifications } = useNotificationCacheManager()
 * ```
 */
export function useNotificationCacheManager() {
  const queryClient = useQueryClient()
  const manager = createNotificationCacheManager(queryClient)

  return {
    /**
     * Invalidate notifications query when preferences change
     */
    invalidateOnPreferenceChange: () => manager.invalidateOnPreferenceChange(),

    /**
     * Invalidate both task detail and notifications when task updates
     */
    invalidateOnTaskUpdate: (taskId: string) => manager.invalidateOnTaskUpdate(taskId),

    /**
     * Filter notifications based on user preferences
     */
    filterDisabledNotifications: (
      notifications: Notification[],
      preferences: NotificationPreferences
    ) => manager.filterDisabledNotifications(notifications, preferences),

    /**
     * Recompute unread count from cache without refetch
     */
    syncUnreadCount: () => manager.syncUnreadCount(),
  }
}
