import { useMemo } from 'react'
import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'

interface NotificationItemProps {
  notification: Notification
  isSelected: boolean
  onSelectionChange: (id: string, selected: boolean) => void
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
}

/**
 * Individual notification item with selection checkbox
 *
 * Features:
 * - Selection checkbox for bulk operations
 * - Type-specific icons
 * - Read/unread styling (slight highlight for unread)
 * - Action menu (mark as read, archive)
 * - Optimized timestamp calculation with memoization
 */
export function NotificationItemWithCheckbox({
  notification,
  isSelected,
  onSelectionChange,
  onMarkAsRead,
  onArchive,
}: NotificationItemProps) {
  const relativeTime = useMemo(
    () => getRelativeTime(new Date(notification.timestamp)),
    [notification.timestamp],
  )

  const getTypeIcon = () => {
    const iconClass = 'w-5 h-5'
    const baseClasses = `${iconClass} flex-shrink-0`

    switch (notification.eventType || notification.type) {
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

  const priorityColor = {
    high: 'text-red-600',
    normal: 'text-gray-600',
    low: 'text-gray-500',
  }[notification.priority || 'normal']

  return (
    <div
      className={`border-b px-3 py-3 transition-colors ${
        isSelected ? 'bg-blue-50' : notification.read ? 'bg-white' : 'bg-blue-50 opacity-80'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectionChange(notification.id, e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 cursor-pointer accent-blue-600"
          aria-label={`Select notification: ${notification.message}`}
        />

        {/* Icon + Content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{getTypeIcon()}</div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium break-words ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
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

        {/* Actions Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              type="button"
              className="text-xs text-blue-600 hover:text-blue-900 font-medium px-1"
              title="Mark as unread"
              aria-label={`Mark ${notification.message} as unread`}
            >
              Mark unread
            </button>
          )}
          <button
            onClick={() => onArchive(notification.id)}
            type="button"
            className="text-xs text-gray-500 hover:text-gray-700 font-medium px-1"
            title="Archive"
            aria-label={`Archive ${notification.message}`}
          >
            Archive
          </button>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
