import { useEffect, useRef, useState } from 'react'
import type { Notification } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { useNotifications } from './useNotifications'
import { useNotificationPreferences } from './useNotificationPreferences'

/**
 * Event emitted when a new notification arrives
 */
export interface NotificationEvent {
  notification: Notification
  timestamp: number
}

/**
 * Hook that wraps useNotifications and emits events for newly-arrived notifications
 *
 * Features:
 * - Detects new notifications by timestamp (within last 35s)
 * - Respects user notification preferences (in-app channel and frequency)
 * - Filters out disabled notification types and 'off' frequency settings
 * - Provides access to new notification events and their metadata
 * - Tracks which notifications have been emitted to prevent duplicates
 *
 * @example
 * const { events, isLoading } = useNotificationEvents()
 * useEffect(() => {
 *   for (const event of events) {
 *     console.log('New notification:', event.notification.message)
 *   }
 * }, [events])
 */
export function useNotificationEvents() {
  const { notifications, isLoading } = useNotifications()
  const { preferences } = useNotificationPreferences()

  const [events, setEvents] = useState<NotificationEvent[]>([])
  const emittedNotificationIdsRef = useRef<Set<string>>(new Set())

  // Determine if a notification should trigger a toast based on preferences
  const shouldShowToast = (notification: Notification): boolean => {
    if (!preferences) {
      // If preferences haven't loaded, be conservative and don't show
      return false
    }

    // Get the preference for this notification type
    const pref = (preferences as any)[notification.type]

    // If preference doesn't exist, skip
    if (!pref) {
      return false
    }

    // Skip if frequency is 'off'
    if (pref.frequency === 'off') {
      return false
    }

    // Skip if 'in-app' channel is not in the channels list
    if (!pref.channels.includes('in-app')) {
      return false
    }

    // Check if notification is new (within last 35 seconds)
    const age = Date.now() - new Date(notification.timestamp).getTime()
    if (age >= 35_000) {
      return false
    }

    return true
  }

  // Track new notifications and emit events
  useEffect(() => {
    const newEvents: NotificationEvent[] = []

    for (const notification of notifications) {
      // Skip if we've already emitted this notification
      if (emittedNotificationIdsRef.current.has(notification.id)) {
        continue
      }

      // Check if it should be shown based on preferences
      if (!shouldShowToast(notification)) {
        continue
      }

      // This is a new notification that should be shown
      emittedNotificationIdsRef.current.add(notification.id)
      newEvents.push({
        notification,
        timestamp: Date.now(),
      })
    }

    if (newEvents.length > 0) {
      setEvents(newEvents)
    }
  }, [notifications, preferences])

  return {
    events,
    isLoading,
    // Expose preferences for downstream consumers
    preferences,
  }
}

export type UseNotificationEventsReturn = ReturnType<typeof useNotificationEvents>
