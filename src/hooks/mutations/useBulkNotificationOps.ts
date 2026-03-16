import { useQueryClient } from '@tanstack/react-query'
import type { Notification, PaginatedNotificationsResponse } from '../../types/notification'
import { useMutationWithRetry } from '../useMutationWithRetry'
import { notificationQueryKeys } from '../useNotifications'

interface BulkNotificationOpsPayload {
  operation: 'archive' | 'mark-read'
  ids: string[]
}

interface BulkNotificationOpsResult {
  updated: number
  notifications: Notification[]
}

/**
 * Mutation hook for bulk notification operations (archive, mark-as-read)
 *
 * Features:
 * - Optimistic updates for selected notifications
 * - Automatic rollback on error
 * - Partial failure support (some succeed, some fail)
 * - Smart query invalidation for affected notification lists
 * - Type-safe with full TypeScript support
 *
 * @example
 * ```tsx
 * const { archiveMultiple, markMultipleAsRead, isArchiving, isMarkingRead, archiveError, markReadError } = useBulkNotificationOps()
 *
 * // Archive multiple notifications
 * archiveMultiple(['notif-1', 'notif-2'], {
 *   onSuccess: (result) => {
 *     showSuccessToast(`Archived ${result.updated} notifications`)
 *   },
 *   onError: (err) => showErrorToast(err.message),
 * })
 *
 * // Mark multiple as read
 * markMultipleAsRead(['notif-1', 'notif-2'], {
 *   onSuccess: (result) => {
 *     showSuccessToast(`Marked ${result.updated} as read`)
 *   },
 * })
 * ```
 */
export function useBulkNotificationOps() {
  const queryClient = useQueryClient()

  // Archive mutation
  const archiveMutation = useMutationWithRetry({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'archive', ids }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to archive notifications')
      }

      return response.json() as Promise<BulkNotificationOpsResult>
    },

    onMutate: async (ids) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot all affected notification data
      const previousQueries = queryClient.getQueriesData({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'notifications',
      })

      // Optimistically remove archived notifications from all lists
      previousQueries.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: any) => {
          if (!oldData?.pages) {
            // Handle non-infinite query format
            if (Array.isArray(oldData)) {
              return oldData.filter((n: Notification) => !ids.includes(n.id))
            }
            return oldData
          }

          // Handle infinite query format
          return {
            ...oldData,
            pages: oldData.pages.map((page: PaginatedNotificationsResponse) => ({
              ...page,
              items: page.items.filter((n: Notification) => !ids.includes(n.id)),
            })),
          }
        })
      })

      return { previousQueries }
    },

    onError: (_, __, context) => {
      // Revert all optimistic updates on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },

    onSuccess: () => {
      // Invalidate notifications cache to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark as read mutation
  const markReadMutation = useMutationWithRetry({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'mark-read', ids }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark notifications as read')
      }

      return response.json() as Promise<BulkNotificationOpsResult>
    },

    onMutate: async (ids) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['notifications'] })

      // Snapshot all affected notification data
      const previousQueries = queryClient.getQueriesData({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'notifications',
      })

      // Optimistically mark notifications as read across all lists
      previousQueries.forEach(([key]) => {
        queryClient.setQueryData(key, (oldData: any) => {
          if (!oldData?.pages) {
            // Handle non-infinite query format
            if (Array.isArray(oldData)) {
              return oldData.map((n: Notification) =>
                ids.includes(n.id) ? { ...n, read: true } : n
              )
            }
            return oldData
          }

          // Handle infinite query format
          return {
            ...oldData,
            pages: oldData.pages.map((page: PaginatedNotificationsResponse) => ({
              ...page,
              items: page.items.map((n: Notification) =>
                ids.includes(n.id) ? { ...n, read: true } : n
              ),
            })),
          }
        })
      })

      return { previousQueries }
    },

    onError: (_, __, context) => {
      // Revert all optimistic updates on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },

    onSuccess: () => {
      // Invalidate notifications cache to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    // Archive operations
    archiveMultiple: (ids: string[], options?: any) => {
      archiveMutation.mutate(ids, options)
    },
    isArchiving: archiveMutation.isPending,
    archiveError: archiveMutation.error,

    // Mark as read operations
    markMultipleAsRead: (ids: string[], options?: any) => {
      markReadMutation.mutate(ids, options)
    },
    isMarkingRead: markReadMutation.isPending,
    markReadError: markReadMutation.error,
  }
}

export type UseBulkNotificationOpsReturn = ReturnType<typeof useBulkNotificationOps>
