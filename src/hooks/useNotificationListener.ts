import { useEffect } from 'react'
import { useNotificationContext } from '../providers/NotificationProvider'
import type { NotificationEventType, Notification } from '../types/notification'
import type { NotificationBroadcastEvent } from '../providers/NotificationProvider'

/**
 * Callback type for notification event listeners
 */
export type NotificationListenerCallback = (
  notification: Notification | Partial<Notification>
) => void

/**
 * Hook to listen for specific notification event types
 *
 * This hook allows components to subscribe to specific notification event types
 * and react to broadcast events. The listener is automatically cleaned up when
 * the component unmounts.
 *
 * Usage:
 * ```tsx
 * useNotificationListener('assignment_changed', (notification) => {
 *   console.log('Assignment changed:', notification)
 * })
 * ```
 *
 * @param eventType - The notification event type to listen for
 * @param callback - Function called when matching event is broadcast
 */
export function useNotificationListener(eventType: NotificationEventType, callback: NotificationListenerCallback) {
  const { subscribe } = useNotificationContext()

  useEffect(() => {
    /**
     * Subscribe to broadcast events and filter by type
     */
    const unsubscribe = subscribe((event: NotificationBroadcastEvent) => {
      if (event.type === eventType) {
        try {
          callback(event.data)
        } catch (error) {
          console.error(`Error in notification listener for ${eventType}:`, error)
        }
      }
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [eventType, callback, subscribe])
}

/**
 * Hook to listen for multiple notification event types
 *
 * This is a convenience hook for components that need to listen to multiple
 * event types and handle them with a single callback.
 *
 * Usage:
 * ```tsx
 * useNotificationListenerMultiple(
 *   ['assignment_changed', 'deadline_approaching'],
 *   (eventType, notification) => {
 *     console.log(`Received ${eventType}:`, notification)
 *   }
 * )
 * ```
 *
 * @param eventTypes - Array of notification event types to listen for
 * @param callback - Function called with event type and notification data
 */
export function useNotificationListenerMultiple(
  eventTypes: NotificationEventType[],
  callback: (eventType: NotificationEventType, notification: Notification | Partial<Notification>) => void
) {
  const { subscribe } = useNotificationContext()

  useEffect(() => {
    /**
     * Subscribe to broadcast events and filter by type list
     */
    const unsubscribe = subscribe((event: NotificationBroadcastEvent) => {
      if (eventTypes.includes(event.type)) {
        try {
          callback(event.type, event.data)
        } catch (error) {
          console.error(`Error in notification listener for ${event.type}:`, error)
        }
      }
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [eventTypes, callback, subscribe])
}
