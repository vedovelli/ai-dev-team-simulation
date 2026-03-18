import { useQueryClient } from '@tanstack/react-query'
import { useMutationWithRetry } from './useMutationWithRetry'
import { notificationQueryKeys } from './useNotifications'
import {
  type AssignFromNotificationRequest,
  type AssignFromNotificationResponse,
  type SnoozeNotificationRequest,
  type SnoozeNotificationResponse,
  type DismissNotificationActionRequest,
  type DismissNotificationActionResponse,
  type BatchNotificationActionsRequest,
  type BatchNotificationActionsResponse,
  type Notification,
  type PaginatedNotificationsResponse,
} from '../types/notification'

/**
 * Query key factory for assignment operations
 * Ensures cache invalidation syncs across related queries
 */
export const assignmentQueryKeys = {
  all: ['assignments'] as const,
  list: () => [...assignmentQueryKeys.all, 'list'] as const,
  detail: (agentId: string) => [...assignmentQueryKeys.all, { agentId }] as const,
}

/**
 * Notification action mutations hook
 *
 * Provides mutations for actionable notification interactions:
 * - Quick-assign tasks from notifications
 * - Snooze non-critical alerts
 * - Dismiss notifications without marking read
 * - Batch operations on multiple notifications
 *
 * Features:
 * - Optimistic updates for responsive UI
 * - Automatic cache invalidation for notifications and assignments
 * - Exponential backoff retry with 3 attempts
 * - Type-safe mutation parameters and responses
 */
export function useNotificationActionMutations() {
  const queryClient = useQueryClient()

  /**
   * Mutation for assigning a task from a notification (quick-assign)
   * Invalidates both notifications and assignments queries
   */
  const assignFromNotificationMutation = useMutationWithRetry<
    AssignFromNotificationResponse,
    AssignFromNotificationRequest
  >({
    mutationFn: async ({ notificationId, agentId }) => {
      const response = await fetch('/api/notifications/actions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, agentId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to assign from notification: ${response.statusText}`)
      }

      return response.json() as Promise<AssignFromNotificationResponse>
    },
    onMutate: async ({ notificationId }) => {
      // Cancel pending notifications requests
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: notificationQueryKeys.list(false) }
      )

      // Optimistically mark notification as read (action taken)
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.map((notif) =>
              notif.id === notificationId ? { ...notif, read: true } : notif
            ),
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
      // Invalidate both notifications and assignments queries
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.all })
    },
  })

  /**
   * Mutation for snoozing a notification
   * Removes notification temporarily, will reappear after duration
   */
  const snoozeNotificationMutation = useMutationWithRetry<
    SnoozeNotificationResponse,
    SnoozeNotificationRequest
  >({
    mutationFn: async ({ notificationId, duration }) => {
      const response = await fetch('/api/notifications/actions/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, duration }),
      })

      if (!response.ok) {
        throw new Error(`Failed to snooze notification: ${response.statusText}`)
      }

      return response.json() as Promise<SnoozeNotificationResponse>
    },
    onMutate: async ({ notificationId }) => {
      // Cancel pending notifications requests
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data across all pages
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: notificationQueryKeys.list(false) }
      )

      // Optimistically remove notification from cache (snooze hides it)
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => {
            const itemIndex = page.items.findIndex((n) => n.id === notificationId)
            if (itemIndex !== -1) {
              return {
                ...page,
                items: page.items.filter((n) => n.id !== notificationId),
              }
            }
            return page
          }),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(notificationQueryKeys.list(true), (old?: any) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PaginatedNotificationsResponse) => ({
              ...page,
              items: page.items.filter((n: Notification) => n.id !== notificationId),
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
      // Refetch first page to get updated unread count
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      })
    },
  })

  /**
   * Mutation for dismissing a notification
   * Removes notification without marking it as read
   */
  const dismissNotificationMutation = useMutationWithRetry<
    DismissNotificationActionResponse,
    DismissNotificationActionRequest
  >({
    mutationFn: async ({ notificationId }) => {
      const response = await fetch(`/api/notifications/actions/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to dismiss notification: ${response.statusText}`)
      }

      return response.json() as Promise<DismissNotificationActionResponse>
    },
    onMutate: async ({ notificationId }) => {
      // Cancel pending notifications requests
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data across all pages
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: notificationQueryKeys.list(false) }
      )

      // Optimistically remove notification from cache
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.filter((n) => n.id !== notificationId),
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(notificationQueryKeys.list(true), (old?: any) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PaginatedNotificationsResponse) => ({
              ...page,
              items: page.items.filter((n: Notification) => n.id !== notificationId),
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
      // Refetch first page to get updated unread count
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: 'active',
      })
    },
  })

  /**
   * Mutation for batch notification actions
   * Supports bulk operations: assign, snooze, dismiss, mark-read
   */
  const batchNotificationActionsMutation = useMutationWithRetry<
    BatchNotificationActionsResponse,
    BatchNotificationActionsRequest
  >({
    mutationFn: async ({ ids, action, payload }) => {
      const response = await fetch('/api/notifications/actions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, payload }),
      })

      if (!response.ok) {
        throw new Error(`Failed to perform batch notification actions: ${response.statusText}`)
      }

      return response.json() as Promise<BatchNotificationActionsResponse>
    },
    onMutate: async ({ ids, action }) => {
      // Cancel pending notifications requests
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<{ pages: PaginatedNotificationsResponse[] }>(
        { queryKey: notificationQueryKeys.list(false) }
      )

      // Optimistically update notifications based on action
      if (previousData) {
        const updated = {
          ...previousData,
          pages: previousData.pages.map((page) => ({
            ...page,
            items: page.items.map((notif) => {
              if (ids.includes(notif.id)) {
                switch (action) {
                  case 'mark-read':
                    return { ...notif, read: true }
                  case 'assign':
                  case 'snooze':
                  case 'dismiss':
                    // These actions remove/hide the notification
                    return notif
                  default:
                    return notif
                }
              }
              return notif
            }).filter((notif) => {
              // Remove dismissed/snoozed notifications from view
              if ((action === 'dismiss' || action === 'snooze') && ids.includes(notif.id)) {
                return false
              }
              return true
            }),
          })),
        }
        queryClient.setQueryData(notificationQueryKeys.list(false), updated)

        // Also update unreadOnly query if it's being used
        queryClient.setQueryData(notificationQueryKeys.list(true), (old?: any) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page: PaginatedNotificationsResponse) => {
              if (action === 'mark-read') {
                return {
                  ...page,
                  items: page.items.filter((n: Notification) => !ids.includes(n.id)),
                }
              }
              if (action === 'dismiss' || action === 'snooze') {
                return {
                  ...page,
                  items: page.items.filter((n: Notification) => !ids.includes(n.id)),
                }
              }
              return page
            }),
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
      // Invalidate both notifications and assignments queries for batch operations
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all })
      if (queryClient.getQueriesData({ queryKey: assignmentQueryKeys.all }).length > 0) {
        queryClient.invalidateQueries({ queryKey: assignmentQueryKeys.all })
      }
    },
  })

  return {
    // Assign from notification
    assignFromNotification: (notificationId: string, agentId: string) => {
      assignFromNotificationMutation.mutate({ notificationId, agentId })
    },
    assignFromNotificationAsync: (notificationId: string, agentId: string) => {
      return assignFromNotificationMutation.mutateAsync({ notificationId, agentId })
    },
    assignFromNotificationLoading: assignFromNotificationMutation.isLoading,
    assignFromNotificationError: assignFromNotificationMutation.error,

    // Snooze notification
    snoozeNotification: (notificationId: string, duration) => {
      snoozeNotificationMutation.mutate({ notificationId, duration })
    },
    snoozeNotificationAsync: (notificationId: string, duration) => {
      return snoozeNotificationMutation.mutateAsync({ notificationId, duration })
    },
    snoozeNotificationLoading: snoozeNotificationMutation.isLoading,
    snoozeNotificationError: snoozeNotificationMutation.error,

    // Dismiss notification
    dismissNotification: (notificationId: string) => {
      dismissNotificationMutation.mutate({ notificationId })
    },
    dismissNotificationAsync: (notificationId: string) => {
      return dismissNotificationMutation.mutateAsync({ notificationId })
    },
    dismissNotificationLoading: dismissNotificationMutation.isLoading,
    dismissNotificationError: dismissNotificationMutation.error,

    // Batch actions
    batchNotificationActions: (ids: string[], action: string, payload?: any) => {
      batchNotificationActionsMutation.mutate({ ids, action: action as any, payload })
    },
    batchNotificationActionsAsync: (ids: string[], action: string, payload?: any) => {
      return batchNotificationActionsMutation.mutateAsync({ ids, action: action as any, payload })
    },
    batchNotificationActionsLoading: batchNotificationActionsMutation.isLoading,
    batchNotificationActionsError: batchNotificationActionsMutation.error,
  }
}

export type UseNotificationActionMutationsReturn = ReturnType<typeof useNotificationActionMutations>
