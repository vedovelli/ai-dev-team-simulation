import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Notification, NotificationEventType } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { useNotifications, type UseNotificationsOptions, notificationQueryKeys } from './useNotifications'
import { useNotificationPreferences, type UseNotificationPreferencesOptions } from './useNotificationPreferences'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Mapping of notification types to human-readable labels
 * Used for display purposes across the notification center
 */
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
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

interface BulkOperationResponse {
  updated: number
  notifications: Notification[]
}

interface BulkDeleteResponse {
  success: boolean
  deletedCount: number
}

/**
 * Type for the paginated notification response structure
 * Used in infinite scroll queries and cache updates
 */
interface PaginatedNotificationResponse {
  pages: Array<{
    items: Notification[]
    nextCursor?: string
  }>
}

/**
 * Configuration for a bulk operation mutation
 */
interface BulkOperationConfig {
  action: 'mark-read' | 'archive' | 'delete'
  errorMessage: string
  updateFn: (notification: Notification, idSet: Set<string>) => Notification | null
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
 *
 * Note: This function checks both `eventType` (modern, structured events) and `type`
 * (legacy) for backwards compatibility. The preference system supports both:
 * - eventType: 'assignment_changed', 'sprint_updated', etc. (preferred)
 * - type: 'task_assigned', 'sprint_started', etc. (legacy fallback)
 * We prioritize eventType if present, otherwise fall back to type.
 */
function filterNotificationsByPreferences(
  notifications: Notification[],
  preferences: NotificationPreferences | undefined,
): Notification[] {
  if (!preferences) return notifications

  return notifications.filter((notification) => {
    // Use eventType if available (structured events), otherwise fall back to type
    // This ensures backwards compatibility with legacy notification types
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
 * Filter notifications by type subscription (structured event types only)
 *
 * This filter operates on structured event types ('assignment_changed', 'sprint_updated', etc.)
 * and checks both notification.eventType (preferred) and notification.type (legacy fallback)
 * for backwards compatibility. The isValidEventType guard ensures only valid structured
 * types are accepted, even when falling back to the type field.
 */
function filterNotificationsByType(
  notifications: Notification[],
  subscribedTypes?: NotificationEventType[],
): Notification[] {
  if (!subscribedTypes || subscribedTypes.length === 0) {
    return notifications
  }

  return notifications.filter((notification) => {
    // Check both eventType (modern) and type (legacy) for backwards compatibility
    const notificationType = notification.eventType || notification.type
    // Use type guard to ensure only valid structured event types are matched
    return isValidEventType(notificationType) && subscribedTypes.includes(notificationType)
  })
}

/**
 * Factory function to create bulk notification mutations with consistent pattern
 *
 * This DRY helper eliminates duplication across mark-as-read, archive, and delete mutations.
 * All three follow the same pattern:
 * 1. Call PATCH /api/notifications/bulk with action parameter
 * 2. Optimistically update cache on client
 * 3. Rollback on error
 * 4. Invalidate on success
 *
 * The updateFn allows each operation to modify notifications differently:
 * - mark-read: updates read flag to true
 * - archive/delete: returns null to filter out the notification
 *
 * Returns object with:
 * - mutate: wrapper function that guards against empty ID arrays (no-op if empty)
 * - isLoading, error: mutation state for component loading indicators
 *
 * Performance: Converts IDs to Set for O(1) lookup performance in updateFn
 */
function createBulkOperationMutation(
  config: BulkOperationConfig,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const mutation = useMutationWithRetry<BulkOperationResponse, { ids: string[] }>({
    mutationFn: async ({ ids }) => {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: config.action }),
      })

      if (!response.ok) {
        throw new Error(config.errorMessage)
      }

      return response.json() as Promise<BulkOperationResponse>
    },
    onMutate: async ({ ids }) => {
      // Cancel any pending notification queries
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.all })

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData<PaginatedNotificationResponse>({
        queryKey: notificationQueryKeys.list(false),
      })

      // Convert IDs to Set for O(1) lookup performance
      const idSet = new Set(ids)

      // Optimistically update the cache
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items
              .map((n) => config.updateFn(n, idSet))
              .filter((n): n is Notification => n !== null),
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(notificationQueryKeys.list(false), context.previousData)
      }
    },
    onSuccess: () => {
      // Invalidate after success to sync with server
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all, refetchType: 'active' })
    },
  })

  // Return object with wrapper function and mutation state
  return {
    mutate: (ids: string[]) => {
      if (ids.length === 0) return
      mutation.mutate({ ids })
    },
    isLoading: mutation.isLoading,
    error: mutation.error,
  }
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
      const previousData = queryClient.getQueryData<PaginatedNotificationResponse>({
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
      const previousData = queryClient.getQueryData<PaginatedNotificationResponse>({
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

  /**
   * Mutation for bulk marking notifications as read
   * Updates the read flag for selected notifications while keeping them in the list
   *
   * Performance: Converted to Set for O(1) ID lookup in bulk operations
   */
  const bulkMarkAsReadMutation = createBulkOperationMutation(
    {
      action: 'mark-read',
      errorMessage: 'Failed to mark notifications as read',
      updateFn: (notification, idSet) => ({
        ...notification,
        read: idSet.has(notification.id) ? true : notification.read,
      }),
    },
    queryClient,
  )

  /**
   * Mark multiple notifications as read via bulk operation
   */
  const bulkMarkAsRead = (ids: string[]) => bulkMarkAsReadMutation.mutate(ids)

  /**
   * Mutation for bulk archiving notifications
   * Archive is a soft-delete: removes from list but preserves in server history/search
   * Archive should be used when user wants to declutter while retaining audit trail
   *
   * Performance: Converted to Set for O(1) ID lookup in bulk operations
   */
  const bulkArchiveMutation = createBulkOperationMutation(
    {
      action: 'archive',
      errorMessage: 'Failed to archive notifications',
      updateFn: (notification, idSet) => (idSet.has(notification.id) ? null : notification),
    },
    queryClient,
  )

  /**
   * Archive multiple notifications
   */
  const bulkArchive = (ids: string[]) => bulkArchiveMutation.mutate(ids)

  /**
   * Mutation for bulk deleting notifications
   * Delete is a hard-delete: removes from list and server (no history preserved)
   * Delete should be used for irrelevant or spam notifications when history isn't needed
   *
   * UX Distinction:
   * - Archive: "I'm done with these but may want to reference them later"
   * - Delete: "I never want to see these again"
   *
   * Performance: Converted to Set for O(1) ID lookup in bulk operations
   */
  const bulkDeleteMutation = createBulkOperationMutation(
    {
      action: 'delete',
      errorMessage: 'Failed to delete notifications',
      updateFn: (notification, idSet) => (idSet.has(notification.id) ? null : notification),
    },
    queryClient,
  )

  /**
   * Delete multiple notifications
   */
  const bulkDelete = (ids: string[]) => bulkDeleteMutation.mutate(ids)

  /**
   * Group notifications by type with readable labels
   */
  const groupedByType = useMemo(() => {
    const groups = new Map<string, Notification[]>()

    filteredNotifications.forEach((notif) => {
      const label = NOTIFICATION_TYPE_LABELS[notif.type] || notif.type
      if (!groups.has(label)) {
        groups.set(label, [])
      }
      groups.get(label)!.push(notif)
    })

    return groups
  }, [filteredNotifications])

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
    bulkMarkAsReadLoading: bulkMarkAsReadMutation.isLoading,
    bulkMarkAsReadError: bulkMarkAsReadMutation.error,
    bulkArchiveLoading: bulkArchiveMutation.isLoading,
    bulkArchiveError: bulkArchiveMutation.error,
    bulkDeleteLoading: bulkDeleteMutation.isLoading,
    bulkDeleteError: bulkDeleteMutation.error,

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
    bulkMarkAsRead,
    bulkArchive,
    bulkDelete,

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

    // Grouping helpers
    groupedByType,
  }
}

export type UseNotificationCenterReturn = ReturnType<typeof useNotificationCenter>
