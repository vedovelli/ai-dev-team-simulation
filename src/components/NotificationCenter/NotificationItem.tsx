import React from 'react'
import { X, User, Zap, Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'
import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDismiss?: (id: string) => void
}

/**
 * Get the appropriate icon for a notification type
 */
function getEventIcon(type: Notification['type']): React.ReactNode {
  const iconProps = { className: 'w-4 h-4' }

  switch (type) {
    case 'assignment_changed':
    case 'task_assigned':
    case 'task_reassigned':
      return <User {...iconProps} />
    case 'sprint_updated':
    case 'sprint_started':
    case 'sprint_completed':
      return <Zap {...iconProps} />
    case 'deadline_approaching':
      return <Clock {...iconProps} />
    case 'comment_added':
      return <MessageSquare {...iconProps} />
    case 'status_changed':
      return <CheckCircle {...iconProps} />
    default:
      return <AlertCircle {...iconProps} />
  }
}

/**
 * Get the color classes for a notification type
 */
function getTypeColor(type: Notification['type']): string {
  switch (type) {
    case 'deadline_approaching':
      return 'bg-amber-50 text-amber-600' // Warning: Amber
    case 'sprint_completed':
    case 'sprint_started':
      return 'bg-green-50 text-green-600' // Success: Green
    case 'task_assigned':
    case 'task_reassigned':
    case 'assignment_changed':
      return 'bg-blue-50 text-blue-600' // Info: Blue
    case 'comment_added':
      return 'bg-purple-50 text-purple-600' // Comment: Purple
    case 'status_changed':
      return 'bg-cyan-50 text-cyan-600' // Status: Cyan
    default:
      return 'bg-slate-50 text-slate-600' // Default: Slate
  }
}

/**
 * NotificationItem component
 *
 * Displays a single notification with:
 * - Type icon with color coding
 * - Message text
 * - Relative timestamp
 * - Unread indicator (blue dot)
 * - Dismiss button
 * - Click to mark as read
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDismiss) {
      onDismiss(notification.id)
    }
  }

  const [bgColor, textColor] = getTypeColor(notification.type).split(' ')

  return (
    <button
      className={`w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors text-left focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-400 ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
      role="listitem"
      aria-label={`${notification.message}${!notification.read ? ' (unread)' : ''}`}
    >
      <div className="flex gap-3">
        {/* Type Icon */}
        <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded ${bgColor} ${textColor}`}>
          {getEventIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm leading-snug ${
                !notification.read
                  ? 'font-semibold text-slate-900'
                  : 'font-medium text-slate-700'
              }`}
            >
              {notification.message}
            </p>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                aria-label={`Dismiss notification: ${notification.message}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Timestamp and Read Indicator */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-500">
              {getRelativeTime(new Date(notification.timestamp))}
            </span>
            {!notification.read && (
              <span
                className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                aria-label="Unread notification indicator"
              />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
