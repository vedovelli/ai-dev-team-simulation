import { getRelativeTime } from '../../lib/utils'
import type { Notification } from '../../types/notification'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

/**
 * NotificationItem Component
 *
 * Individual notification row showing:
 * - Icon by type
 * - Title/message
 * - Body content
 * - Relative timestamp
 * - Unread indicator
 */
export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
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
      task_assigned: (
        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H6a4 4 0 014 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
        </svg>
      ),
      task_reassigned: (
        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H6a4 4 0 014 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
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

  const relativeTime = getRelativeTime(new Date(notification.timestamp))

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
      role="button"
      tabIndex={0}
      aria-label={`${notification.message}${!notification.read ? ' - unread' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !notification.read) {
          onMarkAsRead(notification.id)
        }
      }}
    >
      <div className="flex gap-3 items-start">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{getTypeIcon(notification.type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm ${
              !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
            }`}
          >
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">{relativeTime}</p>
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
          <div className="flex-shrink-0 mt-1">
            <div
              className="w-2 h-2 bg-blue-600 rounded-full"
              aria-label="unread"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </div>
  )
}
