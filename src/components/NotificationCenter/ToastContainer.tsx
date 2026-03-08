import { useNotifications } from '../../hooks/useNotifications'
import { NotificationToast } from '../NotificationToast/NotificationToast'
import { useState } from 'react'

/**
 * ToastContainer Component
 *
 * Listens to the notification cache and displays toast notifications
 * for new incoming notifications. Integrates with the notification system
 * to provide real-time visual feedback.
 *
 * Features:
 * - Auto-dismiss after 5s (configurable)
 * - Click to navigate to related entity
 * - Success, info, warning, error variants
 * - Stacks multiple toasts
 */
export function ToastContainer() {
  const [displayedNotificationIds, setDisplayedNotificationIds] = useState<
    Set<string>
  >(new Set())
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set())

  const { data: notifications } = useNotifications({
    refetchInterval: 30 * 1000,
    unreadOnly: true,
  })

  // Track which notifications have been shown as toasts
  const notificationsToShow = notifications.filter((notif) => {
    const isNew = !displayedNotificationIds.has(notif.id)
    const isDismissed = dismissedToasts.has(notif.id)
    return isNew && !isDismissed && !notif.read
  })

  // Update displayed notifications
  if (notificationsToShow.length > 0) {
    setDisplayedNotificationIds((prev) => {
      const updated = new Set(prev)
      notificationsToShow.forEach((notif) => updated.add(notif.id))
      return updated
    })
  }

  const handleToastDismiss = (id: string) => {
    setDismissedToasts((prev) => new Set(prev).add(id))
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {notificationsToShow.map((notification) => {
        // Map notification types to toast types
        const toastType = {
          agent_event: 'info' as const,
          sprint_change: 'info' as const,
          performance_alert: 'warning' as const,
        }[notification.type] || 'info'

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
