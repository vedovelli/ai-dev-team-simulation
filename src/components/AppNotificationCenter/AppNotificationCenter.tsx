import { useAppNotifications } from '../../hooks/useAppNotifications'
import { AppNotificationItem } from './AppNotificationItem'

/**
 * App Notification Center Sidebar
 *
 * Displays persistent in-app notifications in a sidebar panel.
 * Shows current notifications with manual dismiss capability.
 *
 * Features:
 * - Sidebar display of all active notifications
 * - Type-based styling (success, error, warning, info)
 * - Manual dismiss button
 * - Optional action button support
 * - Empty state when no notifications
 */
export function AppNotificationCenter() {
  const { notifications, dismiss, clearAll, count } = useAppNotifications()

  if (count === 0) {
    return null
  }

  return (
    <aside
      className="fixed right-0 top-16 bottom-0 w-80 bg-white shadow-lg border-l border-gray-200 overflow-y-auto z-40"
      aria-label="Notification Center"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        {count > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            aria-label="Clear all notifications"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.map((notification) => (
          <AppNotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => dismiss(notification.id)}
          />
        ))}
      </div>
    </aside>
  )
}
