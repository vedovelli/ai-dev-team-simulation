import { useQueryClient } from '@tanstack/react-query'
import type { Notification, NotificationsResponse, NotificationType } from '../types/notification'

/**
 * Calculate total unread count across all notification queries
 * Useful for displaying global badge count
 */
export function getGlobalUnreadCount(queryClient: ReturnType<typeof useQueryClient>): number {
  const cache = queryClient.getQueryCache()
  let totalUnread = 0

  // Iterate through all notification queries
  cache.getAll().forEach((query) => {
    if (query.queryKey[0] === 'notifications') {
      const data = query.state.data as NotificationsResponse | undefined
      if (data) {
        totalUnread += data.unreadCount
      }
    }
  })

  return totalUnread
}

/**
 * Get aggregated notification statistics across all categories
 */
export function getNotificationStats(queryClient: ReturnType<typeof useQueryClient>) {
  const cache = queryClient.getQueryCache()
  const stats = {
    total: 0,
    unread: 0,
    byType: {} as Record<NotificationType, { total: number; unread: number }>,
    lastNotificationTime: null as string | null,
  }

  // Initialize type counters
  const types: NotificationType[] = ['agent_event', 'sprint_change', 'performance_alert']
  types.forEach((type) => {
    stats.byType[type] = { total: 0, unread: 0 }
  })

  // Aggregate data from cache
  cache.getAll().forEach((query) => {
    if (query.queryKey[0] === 'notifications') {
      const data = query.state.data as NotificationsResponse | undefined
      if (data) {
        stats.total += data.total
        stats.unread += data.unreadCount

        // Count by type
        data.data.forEach((notif) => {
          if (notif.type in stats.byType) {
            stats.byType[notif.type].total += 1
            if (!notif.read) {
              stats.byType[notif.type].unread += 1
            }
          }

          // Update last notification time
          if (!stats.lastNotificationTime || new Date(notif.timestamp) > new Date(stats.lastNotificationTime)) {
            stats.lastNotificationTime = notif.timestamp
          }
        })
      }
    }
  })

  return stats
}

/**
 * Check if any notification matches a predicate
 * Useful for checking if there are critical alerts
 */
export function hasNotificationMatching(
  queryClient: ReturnType<typeof useQueryClient>,
  predicate: (notification: Notification) => boolean
): boolean {
  const cache = queryClient.getQueryCache()

  for (const query of cache.getAll()) {
    if (query.queryKey[0] === 'notifications') {
      const data = query.state.data as NotificationsResponse | undefined
      if (data && data.data.some(predicate)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if there are any high-priority unread notifications
 */
export function hasHighPriorityAlerts(queryClient: ReturnType<typeof useQueryClient>): boolean {
  return hasNotificationMatching(
    queryClient,
    (n) => !n.read && n.metadata?.priority === 'high'
  )
}

/**
 * Get all unread notifications across all queries
 */
export function getAllUnreadNotifications(queryClient: ReturnType<typeof useQueryClient>): Notification[] {
  const cache = queryClient.getQueryCache()
  const unread: Notification[] = []

  cache.getAll().forEach((query) => {
    if (query.queryKey[0] === 'notifications') {
      const data = query.state.data as NotificationsResponse | undefined
      if (data) {
        unread.push(...data.data.filter((n) => !n.read))
      }
    }
  })

  // Remove duplicates by ID
  return Array.from(new Map(unread.map((n) => [n.id, n])).values())
}
