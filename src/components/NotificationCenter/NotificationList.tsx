import type { Notification } from '../../types/notification'
import { NotificationItem } from './NotificationItem'

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
}

/**
 * NotificationList Component
 *
 * Scrollable list container for notifications with pagination awareness.
 * Displays individual notification items in a vertical stack.
 */
export function NotificationList({ notifications, onMarkAsRead }: NotificationListProps) {
  return (
    <div className="divide-y divide-gray-200">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  )
}
