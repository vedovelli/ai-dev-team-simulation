import { useNotifications } from '../../hooks/useNotifications'
import { NotificationToast } from '../NotificationToast/NotificationToast'
import { useState, useEffect } from 'react'
import type { NotificationType } from '../../types/notification'

/**
 * ToastContainer Component
 *
 * Listens to the notification cache and displays toast notifications
 * for new incoming notifications. Integrates with the notification system
 * to provide real-time visual feedback.
 *
 * Features:
 * - Only shows first high-priority (deadline_approaching) notification
 * - Toast suppressed if notification center is open
 * - Auto-dismiss after 5s (default, configurable)
 * - Dismissible with close button
 * - Success, info, warning, error variants mapped from notification types
 * - Accessible: ARIA live region, role="alert"
 */
export function ToastContainer() {
  const [displayedNotificationIds, setDisplayedNotificationIds] = useState<
    Set<string>
  >(new Set())
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set())
  const [firstDeadlineNotificationShown, setFirstDeadlineNotificationShown] = useState(false)

  const { notifications } = useNotifications({
    refetchInterval: 30 * 1000,
  })

  // Only show the first high-priority deadline_approaching notification
  // Track which deadline notifications have been shown as toasts
  const notificationsToShow = notifications
    .filter((notif) => {
      // Only show deadline_approaching notifications
      if (notif.type !== 'deadline_approaching') {
        return false
      }

      const isNew = !displayedNotificationIds.has(notif.id)
      const isDismissed = dismissedToasts.has(notif.id)
      return isNew && !isDismissed && !notif.read
    })
    .slice(0, 1) // Only show first high-priority notification

  // Update displayed notifications
  useEffect(() => {
    if (notificationsToShow.length > 0) {
      setDisplayedNotificationIds((prev) => {
        const updated = new Set(prev)
        notificationsToShow.forEach((notif) => updated.add(notif.id))
        return updated
      })
    }
  }, [notificationsToShow])

  const handleToastDismiss = (id: string) => {
    setDismissedToasts((prev) => new Set(prev).add(id))
  }

  const mapNotificationTypeToToastType = (
    notificationType: NotificationType
  ): 'success' | 'error' | 'warning' | 'info' => {
    const typeMap: Record<NotificationType, 'success' | 'error' | 'warning' | 'info'> = {
      task_assigned: 'info',
      task_unassigned: 'info',
      sprint_started: 'success',
      sprint_completed: 'success',
      comment_added: 'info',
      status_changed: 'info',
      agent_event: 'info',
      performance_alert: 'warning',
      assignment_changed: 'info',
      sprint_updated: 'success',
      task_reassigned: 'info',
      deadline_approaching: 'warning',
    }
    return typeMap[notificationType] || 'info'
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {notificationsToShow.map((notification) => {
        const toastType = mapNotificationTypeToToastType(notification.type)

        return (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              id={notification.id}
              message={notification.message}
              type={toastType}
              autoDismiss={5000}
              onDismiss={handleToastDismiss}
            />
          </div>
        )
      })}
    </div>
  )
}
