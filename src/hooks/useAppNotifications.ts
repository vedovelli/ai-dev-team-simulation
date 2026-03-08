import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { NotificationType } from './useNotification'

/**
 * In-app notification stored in Query cache
 * Separate from server-backed notifications
 */
export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible: boolean
  createdAt: string
  duration?: number // Auto-dismiss timeout in ms (default 5000)
}

/**
 * Response structure for notifications query
 */
interface AppNotificationsData {
  notifications: AppNotification[]
}

/**
 * Options for useAppNotifications hook
 */
export interface UseAppNotificationsOptions {
  /** Enable auto-cleanup of dismissed notifications (default: true) */
  enableAutoCleanup?: boolean
  /** Auto-cleanup interval in ms (default: 60000 = 1 minute) */
  cleanupInterval?: number
}

/**
 * Custom hook for managing in-app notifications using TanStack Query
 *
 * Features:
 * - Query-based state management for notifications
 * - Add notifications with automatic ID generation
 * - Auto-dismiss with configurable duration (default 5 seconds)
 * - Manual dismiss capability
 * - Stale-while-revalidate strategy
 * - Optimistic updates
 * - Multiple notifications stack gracefully
 *
 * @example
 * ```tsx
 * const { notifications, addNotification, dismiss } = useAppNotifications()
 *
 * // Success notification (auto-dismiss in 5s)
 * addNotification({
 *   type: 'success',
 *   message: 'Task created successfully!',
 *   dismissible: true
 * })
 *
 * // Error notification (no auto-dismiss)
 * addNotification({
 *   type: 'error',
 *   message: 'Failed to create task',
 *   dismissible: true,
 *   duration: 0 // Don't auto-dismiss
 * })
 *
 * // With custom action
 * addNotification({
 *   type: 'warning',
 *   message: 'Unsaved changes',
 *   dismissible: true,
 *   action: {
 *     label: 'Save Now',
 *     onClick: () => saveData()
 *   }
 * })
 * ```
 */
export function useAppNotifications(options: UseAppNotificationsOptions = {}) {
  const { enableAutoCleanup = true, cleanupInterval = 60 * 1000 } = options
  const queryClient = useQueryClient()
  const queryKey = ['app-notifications']

  // Query: Fetch notifications from cache (synthetic data, never calls API)
  const query = useQuery<AppNotificationsData, Error>({
    queryKey,
    queryFn: () => {
      // Return empty list if not in cache - initializes on first render
      return { notifications: [] }
    },
    staleTime: Infinity, // Never stale - we manage cache ourselves
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchInterval: enableAutoCleanup ? cleanupInterval : false,
  })

  // Mutation: Add notification
  const addMutation = useMutation({
    mutationFn: async (input: Omit<AppNotification, 'id' | 'createdAt'>) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const notification: AppNotification = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
        duration: input.duration ?? 5000, // Default 5 seconds
      }

      return notification
    },
    onMutate: async (input) => {
      // Cancel any pending queries
      await queryClient.cancelQueries({ queryKey })

      // Get current data
      const previous = queryClient.getQueryData<AppNotificationsData>(queryKey)

      // Optimistically add notification
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const notification: AppNotification = {
        ...input,
        id,
        createdAt: new Date().toISOString(),
        duration: input.duration ?? 5000,
      }

      queryClient.setQueryData<AppNotificationsData>(queryKey, (old) => {
        return {
          notifications: [...(old?.notifications || []), notification],
        }
      })

      return { previous, notification }
    },
    onSuccess: (notification, _, context) => {
      // Setup auto-dismiss if duration is set and > 0
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          dismiss(notification.id)
        }, notification.duration)
      }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
  })

  // Mutation: Dismiss notification
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return notificationId
    },
    onMutate: async (notificationId) => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey })

      // Get current data
      const previous = queryClient.getQueryData<AppNotificationsData>(queryKey)

      // Optimistically remove
      queryClient.setQueryData<AppNotificationsData>(queryKey, (old) => {
        return {
          notifications: (old?.notifications || []).filter(
            (n) => n.id !== notificationId
          ),
        }
      })

      return previous
    },
    onError: (_, __, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context)
      }
    },
  })

  // Mutation: Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return undefined
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<AppNotificationsData>(queryKey)
      queryClient.setQueryData<AppNotificationsData>(queryKey, {
        notifications: [],
      })
      return previous
    },
    onError: (_, __, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context)
      }
    },
  })

  // User-friendly API functions
  const addNotification = useCallback(
    (input: Omit<AppNotification, 'id' | 'createdAt'>) => {
      return addMutation.mutateAsync(input)
    },
    [addMutation]
  )

  const dismiss = useCallback(
    (notificationId: string) => {
      dismissMutation.mutate(notificationId)
    },
    [dismissMutation]
  )

  const clearAll = useCallback(() => {
    clearAllMutation.mutate()
  }, [clearAllMutation])

  // Convenience methods for different notification types
  const success = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: 'success',
        message,
        dismissible: true,
        duration,
      })
    },
    [addNotification]
  )

  const error = useCallback(
    (message: string, duration: number = 0) => {
      return addNotification({
        type: 'error',
        message,
        dismissible: true,
        duration, // Default no auto-dismiss for errors
      })
    },
    [addNotification]
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: 'warning',
        message,
        dismissible: true,
        duration,
      })
    },
    [addNotification]
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: 'info',
        message,
        dismissible: true,
        duration,
      })
    },
    [addNotification]
  )

  return {
    // State
    notifications: query.data?.notifications || [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    error: query.error,

    // Core mutations
    addNotification,
    dismiss,
    clearAll,

    // Convenience methods
    success,
    error,
    warning,
    info,

    // Metadata
    count: (query.data?.notifications || []).length,
  }
}
