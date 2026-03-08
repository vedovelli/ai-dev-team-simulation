import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  isMarkingAsRead: boolean
}

/**
 * NotificationItem Component
 *
 * Individual notification card with:
 * - Category icon
 * - Message
 * - Relative timestamp
 * - Read/unread indicator
 * - Quick actions
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
}: NotificationItemProps) {
  const getCategoryIcon = () => {
    switch (notification.type) {
      case 'agent_event':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        )
      case 'sprint_change':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2a1 1 0 001 1h1v3H4a2 2 0 00-2 2v2a1 1 0 001 1h1v1a1 1 0 102 0v-1h6v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-3h1a1 1 0 100-2h-1V7h1a1 1 0 100-2h-1V4a2 2 0 00-2-2h-1V3a1 1 0 00-1-1zm2 5a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'performance_alert':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 1 1 0 000-2 4 4 0 00-4 4v10a4 4 0 004 4h12a4 4 0 004-4V5a4 4 0 00-4-4 1 1 0 000 2 2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
              clipRule="evenodd"
            />
          </svg>
        )
    }
  }

  const getCategoryLabel = () => {
    switch (notification.type) {
      case 'agent_event':
        return 'Agent'
      case 'sprint_change':
        return 'Sprint'
      case 'performance_alert':
        return 'Performance'
      default:
        return 'Notification'
    }
  }

  const getCategoryColor = () => {
    switch (notification.type) {
      case 'agent_event':
        return 'bg-blue-100 text-blue-700'
      case 'sprint_change':
        return 'bg-purple-100 text-purple-700'
      case 'performance_alert':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const iconColor = {
    agent_event: 'text-blue-600',
    sprint_change: 'text-purple-600',
    performance_alert: 'text-orange-600',
  }[notification.type] || 'text-gray-600'

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      role="menuitem"
    >
      <div className="flex gap-3">
        {/* Category Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
          {getCategoryIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor()}`}
            >
              {getCategoryLabel()}
            </span>
            {!notification.read && (
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" aria-label="Unread" />
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-800 line-clamp-2">{notification.message}</p>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-1">
            {getRelativeTime(new Date(notification.timestamp))}
          </p>
        </div>

        {/* Action */}
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            disabled={isMarkingAsRead}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
