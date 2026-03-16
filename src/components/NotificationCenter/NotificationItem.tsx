import type { Notification } from '../../types/notification'

interface NotificationItemProps {
  notification: Notification
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}

export function NotificationItem({
  notification,
  isSelected,
  onToggleSelect,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      assignment_changed: (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      ),
      sprint_updated: (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
        </svg>
      ),
      deadline_approaching: (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.5a1 1 0 002 0V7z" clipRule="evenodd" />
        </svg>
      ),
    }
    return icons[type] || (
      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H6a4 4 0 014 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
      </svg>
    )
  }

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        notification.read
          ? 'bg-gray-50 border-gray-200'
          : 'bg-blue-50 border-blue-200'
      } hover:shadow-sm transition-shadow`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(notification.id)}
        className="w-4 h-4 mt-1 rounded border-gray-300"
        aria-label={`Select notification: ${notification.message}`}
      />

      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getTypeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            notification.read ? 'text-gray-600' : 'font-semibold text-gray-900'
          }`}
        >
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {notification.type}
          </span>
          <span className="text-xs text-gray-500">
            {getRelativeTime(notification.timestamp)}
          </span>
          {notification.priority === 'high' && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
              High Priority
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Mark as read"
          >
            Read
          </button>
        )}
        <button
          onClick={() => onDismiss(notification.id)}
          className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
