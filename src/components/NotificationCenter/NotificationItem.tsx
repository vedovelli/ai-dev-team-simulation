import type { Notification } from '../../types/notification'

interface NotificationItemProps {
  notification: Notification
  isUnread: boolean
  onMarkAsRead: (id: string) => void
}

/**
 * Individual notification item with read/unread styling
 */
export default function NotificationItem({
  notification,
  isUnread,
  onMarkAsRead,
}: NotificationItemProps) {
  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id)
    }
  }

  // Format timestamp for display
  const timestamp = new Date(notification.timestamp)
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let relativeTime: string
  if (diffMins < 1) {
    relativeTime = 'just now'
  } else if (diffMins < 60) {
    relativeTime = `${diffMins}m ago`
  } else if (diffHours < 24) {
    relativeTime = `${diffHours}h ago`
  } else if (diffDays < 30) {
    relativeTime = `${diffDays}d ago`
  } else {
    relativeTime = timestamp.toLocaleDateString()
  }

  // Determine priority color
  const priorityColor = {
    high: 'text-red-600',
    normal: 'text-gray-600',
    low: 'text-gray-500',
  }[notification.priority || 'normal']

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        isUnread
          ? 'bg-blue-50'
          : 'bg-white opacity-75'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-500">{relativeTime}</span>
            {notification.priority === 'high' && (
              <span className={`text-xs font-semibold ${priorityColor}`}>High Priority</span>
            )}
          </div>
        </div>
        {isUnread && (
          <div className="mt-1 flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
        )}
      </div>
    </button>
  )
}
