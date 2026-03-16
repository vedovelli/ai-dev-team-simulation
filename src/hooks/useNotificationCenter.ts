import { useMemo, useState } from 'react'
import type { Notification, NotificationType } from '../types/notification'
import { useNotifications } from './useNotifications'
import { useNotificationPreferences } from './useNotificationPreferences'

/**
 * Filter state for notification center
 */
export type NotificationCenterFilterStatus = 'all' | 'unread'

/**
 * Configuration options for useNotificationCenter hook
 */
export interface UseNotificationCenterOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Return type for useNotificationCenter hook
 */
export interface UseNotificationCenterReturn {
  // Notification data
  notifications: Notification[]
  unreadCount: number
  total: number

  // Preferences
  preferences: any

  // Filter state
  filterStatus: NotificationCenterFilterStatus
  filterType: NotificationType | null
  setFilterStatus: (status: NotificationCenterFilterStatus) => void
  setFilterType: (type: NotificationType | null) => void
  clearFilters: () => void

  // Grouped notifications
  groupedNotifications: Map<string, Notification[]>

  // Actions
  markAsRead: (id: string) => void
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => void
  dismissAllReadNotifications: () => void

  // Query state
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Mutation states
  isMarkingAsRead: boolean
  isDeletingNotification: boolean
  isDismissingAll: boolean
}

/**
 * Orchestrate useNotifications and useNotificationPreferences hooks
 * Manages filter state internally and provides unified interface
 *
 * Features:
 * - Unified interface for notification state + user preferences
 * - Mark-as-read (single + batch) with optimistic updates
 * - Delete notification with immediate cache update
 * - Filter state managed internally (unread/type)
 * - Group notifications by type + timestamp
 */
export function useNotificationCenter(options: UseNotificationCenterOptions = {}) {
  const { refetchInterval = 30 * 1000, refetchOnWindowFocus = true } = options

  // Fetch notifications and preferences
  const notificationsQuery = useNotifications({
    refetchInterval,
    refetchOnWindowFocus,
  })

  const preferencesQuery = useNotificationPreferences({
    refetchOnWindowFocus,
  })

  // Filter state
  const [filterStatus, setFilterStatus] = useState<NotificationCenterFilterStatus>('all')
  const [filterType, setFilterType] = useState<NotificationType | null>(null)

  // Get all notifications from query
  const allNotifications = notificationsQuery.notifications

  // Apply filters
  const filteredNotifications = useMemo(() => {
    let result = [...allNotifications]

    // Filter by read status
    if (filterStatus === 'unread') {
      result = result.filter((n) => !n.read)
    }

    // Filter by type
    if (filterType) {
      result = result.filter((n) => n.type === filterType || n.eventType === filterType)
    }

    return result
  }, [allNotifications, filterStatus, filterType])

  // Group notifications by type + date
  const groupedNotifications = useMemo(() => {
    const groups = new Map<string, Notification[]>()

    filteredNotifications.forEach((notif) => {
      // Use event type if available, otherwise use type
      const notifType = notif.eventType || notif.type

      // Get date for grouping (YYYY-MM-DD)
      const date = new Date(notif.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

      const key = `${notifType}::${date}`

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(notif)
    })

    return groups
  }, [filteredNotifications])

  // Action: Clear all filters
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterType(null)
  }

  // Action: Mark all as read
  const markAllAsRead = async () => {
    if (filteredNotifications.length === 0) return

    const unreadIds = filteredNotifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      await notificationsQuery.markMultipleAsRead(unreadIds)
    } catch (error) {
      throw new Error(`Failed to mark all as read: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Action: Delete notification
  const deleteNotification = (id: string) => {
    notificationsQuery.dismissNotification(id)
  }

  return {
    // Notification data
    notifications: filteredNotifications,
    unreadCount: notificationsQuery.unreadCount,
    total: notificationsQuery.total,

    // Preferences
    preferences: preferencesQuery.preferences,

    // Filter state
    filterStatus,
    filterType,
    setFilterStatus,
    setFilterType,
    clearFilters,

    // Grouped notifications
    groupedNotifications,

    // Actions
    markAsRead: notificationsQuery.markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissAllReadNotifications: notificationsQuery.dismissAllReadNotifications,

    // Query state
    isLoading: notificationsQuery.isLoading || preferencesQuery.isLoading,
    isError: notificationsQuery.isError || preferencesQuery.isError,
    error: notificationsQuery.error || preferencesQuery.error,

    // Mutation states
    isMarkingAsRead: notificationsQuery.markAsReadLoading,
    isDeletingNotification: notificationsQuery.dismissLoading,
    isDismissingAll: notificationsQuery.dismissAllReadLoading,
  }
}

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>
