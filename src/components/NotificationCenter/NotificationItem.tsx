import { useMemo } from 'react'
import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'

interface NotificationItemProps {
  notification: Notification
  isUnread: boolean
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Individual notification item with read/unread styling
 *
 * Features:
 * - Type-specific icons for visual context
 * - Optimized timestamp calculation with memoization
 * - Mark as read and delete actions
 * - Priority indicator
 */
export default function NotificationItem({
  notification,
  isUnread,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  // Memoize relative time calculation to avoid recalculating on every render
  const relativeTime = useMemo(
    () => getRelativeTime(new Date(notification.timestamp)),
    [notification.timestamp]
  )

  // Type-specific icons for visual context
  const getTypeIcon = () => {
    const iconClass = 'w-5 h-5'
    const baseClasses = `${iconClass} flex-shrink-0`

    switch (notification.type) {
      case 'assignment_changed':
        return (
          <svg className={`${baseClasses} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        )
      case 'sprint_updated':
        return (
          <svg className={`${baseClasses} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
          </svg>
        )
      case 'deadline_approaching':
        return (
          <svg className={`${baseClasses} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.5a1 1 0 002 0V7z" clipRule="evenodd" />
          </svg>
        )
      case 'task_assigned':
      case 'task_reassigned':
        return (
          <svg className={`${baseClasses} text-purple-500`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H6a4 4 0 014 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className={`${baseClasses} text-gray-400`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H6a4 4 0 014 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
          </svg>
        )
    }
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
      role="article"
      aria-label={`${notification.message}${isUnread ? ' - unread' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Type icon */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{getTypeIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium break-words ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.message}
            </p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">{relativeTime}</span>
              {notification.priority === 'high' && (
                <span className={`text-xs font-semibold ${priorityColor}`}>High Priority</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isUnread && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              type="button"
              className="text-xs text-blue-600 hover:text-blue-900 font-medium"
              aria-label={`Mark ${notification.message} as read`}
            >
              Read
            </button>
          )}
          <button
            onClick={handleDelete}
            type="button"
            className="text-xs text-gray-500 hover:text-red-600 font-medium"
            aria-label={`Delete ${notification.message}`}
          >
            ✕
          </button>

          {isUnread && (
            <div className="h-2 w-2 rounded-full bg-blue-600" aria-label="unread" aria-hidden="true" />
          )}
        </div>
      </div>
    </button>
  )
}
