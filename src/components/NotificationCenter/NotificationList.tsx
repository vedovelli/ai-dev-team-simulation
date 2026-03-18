import type { Notification } from '../../types/notification'
import NotificationItem from './NotificationItem'

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
}

/**
 * NotificationList - Renders list of notifications
 *
 * Features:
 * - Shows notifications with icons, title, relative timestamp
 * - Click to mark as read
 * - Unread visual indicator
 */
export function NotificationList({
  notifications,
  onMarkAsRead,
}: NotificationListProps) {
  return (
    <div className="divide-y divide-gray-200">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          isUnread={!notification.read}
          onMarkAsRead={onMarkAsRead}
          onDelete={() => {}} // Delete handled by dismiss via hook
        />
      ))}
    </div>
  )
}
