import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotificationContext } from '../providers/NotificationProvider'
import type { NotificationEventType, Notification } from '../types/notification'

/**
 * Options for broadcasting a notification event
 */
export interface NotificationBroadcastOptions {
  /** Notification event type */
  type: NotificationEventType
  /** Notification data or partial notification */
  data: Notification | Partial<Notification>
  /** Whether to refetch active queries (default: true) */
  refetchActive?: boolean
}

/**
 * Hook to broadcast notification events and invalidate related query caches
 *
 * This hook provides a way to emit notification events across the app and
 * automatically invalidate the notifications query cache to trigger refetches.
 *
 * Usage:
 * ```tsx
 * const { broadcast } = useNotificationBroadcast()
 *
 * // Broadcast an event
 * broadcast({
 *   type: 'assignment_changed',
 *   data: { id: '123', type: 'task_assigned', message: 'You were assigned a task' }
 * })
 * ```
 */
export function useNotificationBroadcast() {
  const queryClient = useQueryClient()
  const { broadcast } = useNotificationContext()

  /**
   * Broadcast a notification event and invalidate notification caches
   */
  const broadcastNotification = useCallback(
    (options: NotificationBroadcastOptions) => {
      const { type, data, refetchActive = true } = options

      // Broadcast the event to all subscribers
      broadcast({
        type,
        data,
        timestamp: Date.now(),
      })

      // Invalidate the notifications query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
        refetchType: refetchActive ? 'active' : 'inactive',
      })
    },
    [broadcast, queryClient]
  )

  return {
    /**
     * Broadcast a notification event
     */
    broadcast: broadcastNotification,
  }
}
