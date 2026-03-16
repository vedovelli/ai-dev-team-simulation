import { QueryClient } from '@tanstack/react-query'
import type { Notification, PaginatedNotificationsResponse } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'

/**
 * NotificationCacheManager — Coordinates cache invalidation across notifications,
 * tasks, and preferences domains to prevent stale data when notification state
 * ripples through the app.
 *
 * Reuses pattern from CacheInvalidationManager (FAB-60), scoped to notifications.
 */
export class NotificationCacheManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate notifications query when preferences change
   * Prevents showing notifications of disabled types
   */
  invalidateOnPreferenceChange() {
    return this.queryClient.invalidateQueries({
      queryKey: ['notifications'],
      refetchType: 'active',
    })
  }

  /**
   * Invalidate both task detail and notifications when a task is updated
   * Ensures notification feed reflects latest task state
   */
  invalidateOnTaskUpdate(taskId: string) {
    return Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: ['tasks', taskId],
        refetchType: 'active',
      }),
      this.queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      }),
    ])
  }

  /**
   * Filter out notifications whose type is disabled in user preferences
   * Pure function, no side effects
   */
  filterDisabledNotifications(
    notifications: Notification[],
    preferences: NotificationPreferences
  ): Notification[] {
    return notifications.filter((notification) => {
      const notificationType = notification.type as keyof NotificationPreferences
      const typePreference = preferences[notificationType]

      // If preference exists and is disabled, filter out the notification
      if (typePreference && typeof typePreference === 'object' && 'enabled' in typePreference) {
        return (typePreference as any).enabled !== false
      }

      // Default: keep notification if no preference found
      return true
    })
  }

  /**
   * Recompute unread count from current cache without refetch
   * Aggregates unread notifications across all loaded pages
   */
  syncUnreadCount(): number {
    // Get unread notifications from both filtered and unfiltered queries
    const unreadNotifications = this.queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>({
      queryKey: ['notifications', { unreadOnly: false }],
    })

    if (!unreadNotifications?.pages) {
      return 0
    }

    // Count unread across all pages
    return unreadNotifications.pages.reduce((count, page) => {
      return count + page.items.filter((notif) => !notif.read).length
    }, 0)
  }
}

/**
 * Create a NotificationCacheManager instance
 */
export function createNotificationCacheManager(queryClient: QueryClient) {
  return new NotificationCacheManager(queryClient)
}
