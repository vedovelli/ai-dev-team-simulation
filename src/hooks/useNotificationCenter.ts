import { useMemo } from 'react'
import { useNotifications } from './useNotifications'
import type { Notification, NotificationFilter } from '../types/notification'

/**
 * Configuration options for useNotificationCenter hook
 */
export interface UseNotificationCenterOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Filter to show only unread notifications (default: false) */
  unreadOnly?: boolean
  /** Initial filter type (default: 'all') */
  initialFilter?: NotificationFilter
  /** Enable virtual scrolling for large lists (default: true) */
  enableVirtualization?: boolean
  /** Virtual list window size in pixels (default: 400) */
  virtualWindowSize?: number
}

/**
 * Group notifications by date with readable labels
 */
function groupByDate(notifications: Notification[]): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>()
  const now = new Date()

  notifications.forEach((notif) => {
    const notifDate = new Date(notif.timestamp)
    let label = ''

    // Determine date label
    if (isToday(notifDate, now)) {
      label = 'Today'
    } else if (isYesterday(notifDate, now)) {
      label = 'Yesterday'
    } else if (isThisWeek(notifDate, now)) {
      label = notifDate.toLocaleDateString('en-US', { weekday: 'long' })
    } else if (isThisMonth(notifDate, now)) {
      label = notifDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      label = notifDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }

    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label)!.push(notif)
  })

  return groups
}

/**
 * Group notifications by type with readable labels
 */
function groupByType(
  notifications: Notification[]
): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>()

  const typeLabels: Record<string, string> = {
    assignment_changed: 'Assignments',
    sprint_updated: 'Sprints',
    task_reassigned: 'Task Changes',
    deadline_approaching: 'Deadlines',
    task_assigned: 'Task Assignments',
    task_unassigned: 'Unassignments',
    sprint_started: 'Sprint Started',
    sprint_completed: 'Sprint Completed',
    comment_added: 'Comments',
    status_changed: 'Status Changes',
    agent_event: 'Agent Activity',
    performance_alert: 'Performance Alerts',
  }

  notifications.forEach((notif) => {
    const label = typeLabels[notif.type] || notif.type
    if (!groups.has(label)) {
      groups.set(label, [])
    }
    groups.get(label)!.push(notif)
  })

  return groups
}

/**
 * Smart pagination/windowing helper for virtual lists
 */
function calculateWindow(
  items: Notification[],
  startIndex: number,
  windowSize: number
): { items: Notification[]; startIndex: number; endIndex: number } {
  const endIndex = Math.min(startIndex + windowSize, items.length)
  return {
    items: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
  }
}

/**
 * Date helper functions
 */
function isToday(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  )
}

function isThisWeek(date: Date, now: Date): boolean {
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return date > weekAgo && !isYesterday(date, now) && !isToday(date, now)
}

function isThisMonth(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date < new Date(now.getFullYear(), now.getMonth() + 1, 0)
  )
}

/**
 * Notification Center Hook with Performance Optimizations
 *
 * Wraps `useNotifications` with:
 * - Smart pagination/windowing for lists with 50+ notifications
 * - Unread badge count state management (derived from notification state)
 * - Mark-as-read batch operations with TanStack Query cache sync
 * - Notification filtering (all / unread toggle)
 * - Group helpers: groupByDate() and groupByType() utility functions
 * - Virtual scrolling support for large notification lists
 *
 * Features:
 * - Query key structure: `['notifications', { filter, page }]`
 * - Stale: 30s, GC: 2min (matches useNotifications)
 * - Optimistic mark-as-read with rollback on error
 * - Computed values: unreadCount, total notifications
 * - Helper functions for grouping and pagination
 */
export function useNotificationCenter(
  options: UseNotificationCenterOptions = {}
) {
  const {
    refetchInterval = 30 * 1000,
    unreadOnly = false,
    enableVirtualization = true,
    virtualWindowSize = 400,
  } = options

  // Use base notifications hook
  const notificationsHook = useNotifications({
    refetchInterval,
    unreadOnly,
  })

  const {
    notifications,
    unreadCount,
    total,
    markAsRead,
    markMultipleAsRead,
    isLoading,
    error,
    ...rest
  } = notificationsHook

  /**
   * Computed values for unread badge count
   */
  const badgeCount = useMemo(() => {
    return Math.min(unreadCount, 99)
  }, [unreadCount])

  /**
   * Group notifications by date
   * Returns a Map where keys are date labels and values are notification arrays
   */
  const groupedByDate = useMemo(() => {
    return groupByDate(notifications)
  }, [notifications])

  /**
   * Group notifications by type
   * Returns a Map where keys are type labels and values are notification arrays
   */
  const groupedByType = useMemo(() => {
    return groupByType(notifications)
  }, [notifications])

  /**
   * Smart pagination for virtual lists
   * Calculates which items should be rendered based on current scroll position
   */
  const calculateVirtualWindow = (startIndex: number) => {
    return calculateWindow(notifications, startIndex, virtualWindowSize)
  }

  /**
   * Batch mark multiple notifications as read
   * Updates cache optimistically and syncs with query state
   */
  const markBatchAsRead = async (ids: string[]) => {
    if (ids.length === 0) return

    try {
      await markMultipleAsRead(ids)
    } catch (err) {
      console.error('Failed to mark batch as read:', err)
      throw err
    }
  }

  /**
   * Mark all unread notifications as read
   */
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await markBatchAsRead(unreadIds)
    }
  }

  return {
    // Base notification hook state and methods
    ...rest,
    notifications,
    unreadCount,
    total,
    isLoading,
    error,

    // Mark as read operations
    markAsRead,
    markMultipleAsRead,
    markBatchAsRead,
    markAllAsRead,

    // Computed badge count (capped at 99)
    badgeCount,

    // Grouping helpers
    groupedByDate,
    groupedByType,

    // Virtual scrolling helper
    calculateVirtualWindow,
    enableVirtualization,
    virtualWindowSize,
  }
}

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>
