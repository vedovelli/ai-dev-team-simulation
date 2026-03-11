import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  isMarkingAsRead: boolean
  onDismiss?: () => void
  isDismissing?: boolean
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
  onDismiss,
  isDismissing,
}: NotificationItemProps) {
  const getCategoryIcon = () => {
    // Task-related icons
    if (notification.type === 'task_assigned' || notification.type === 'task_unassigned') {
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

    // Sprint-related icons
    if (notification.type === 'sprint_started' || notification.type === 'sprint_completed') {
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
    }

    // Comment icon
    if (notification.type === 'comment_added') {
      return (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.707 1.293a1 1 0 00-1.414 1.414L5.586 10l-1.293 1.293a1 1 0 101.414 1.414L7 11.414l1.293 1.293a1 1 0 001.414-1.414L8.414 10l1.293-1.293a1 1 0 00-1.414-1.414L7 8.586 5.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )
    }

    // Status change icon
    if (notification.type === 'status_changed') {
      return (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 105.199 7.99V4a1 1 0 01-1-1V2a1 1 0 011-1zm7 5a1 1 0 011 1v5a1 1 0 11-2 0V8a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      )
    }

    // Agent event icon
    if (notification.type === 'agent_event') {
      return (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      )
    }

    // Performance alert icon
    if (notification.type === 'performance_alert') {
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
    }

    // Default notification icon
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

  const getCategoryLabel = () => {
    switch (notification.type) {
      case 'task_assigned':
        return 'Task Assigned'
      case 'task_unassigned':
        return 'Task Unassigned'
      case 'sprint_started':
        return 'Sprint Started'
      case 'sprint_completed':
        return 'Sprint Completed'
      case 'comment_added':
        return 'Comment'
      case 'status_changed':
        return 'Status Changed'
      case 'agent_event':
        return 'Agent'
      case 'performance_alert':
        return 'Performance'
      default:
        return 'Notification'
    }
  }

  const getCategoryColor = () => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_unassigned':
        return 'bg-cyan-100 text-cyan-700'
      case 'sprint_started':
      case 'sprint_completed':
        return 'bg-purple-100 text-purple-700'
      case 'comment_added':
        return 'bg-emerald-100 text-emerald-700'
      case 'status_changed':
        return 'bg-indigo-100 text-indigo-700'
      case 'agent_event':
        return 'bg-blue-100 text-blue-700'
      case 'performance_alert':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const iconColorMap = {
    task_assigned: 'text-cyan-600',
    task_unassigned: 'text-cyan-600',
    sprint_started: 'text-purple-600',
    sprint_completed: 'text-purple-600',
    comment_added: 'text-emerald-600',
    status_changed: 'text-indigo-600',
    agent_event: 'text-blue-600',
    performance_alert: 'text-orange-600',
  } as const

  const iconColor = iconColorMap[notification.type as keyof typeof iconColorMap] || 'text-gray-600'

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

        {/* Actions */}
        <div className="flex-shrink-0 ml-2 flex gap-1">
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isMarkingAsRead}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
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
          {onDismiss && (
            <button
              onClick={onDismiss}
              disabled={isDismissing}
              className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
