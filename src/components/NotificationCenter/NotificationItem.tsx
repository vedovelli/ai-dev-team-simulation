import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDismiss?: (id: string) => void
}

function getEventIcon(type: Notification['type']): React.ReactNode {
  switch (type) {
    case 'assignment_changed':
    case 'task_assigned':
    case 'task_reassigned':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      )
    case 'sprint_updated':
    case 'sprint_started':
    case 'sprint_completed':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )
    case 'deadline_approaching':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    case 'comment_added':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 2z"
          />
        </svg>
      )
    case 'status_changed':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
  }
}

function getEventColor(type: Notification['type']): string {
  switch (type) {
    case 'deadline_approaching':
      return 'text-orange-400'
    case 'sprint_completed':
    case 'sprint_started':
      return 'text-green-400'
    case 'task_assigned':
    case 'task_reassigned':
    case 'assignment_changed':
      return 'text-blue-400'
    default:
      return 'text-slate-400'
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      className={`px-4 py-3 border-b border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer ${
        !notification.read ? 'bg-slate-800/50' : ''
      }`}
      role="listitem"
      onClick={handleMarkAsRead}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${getEventColor(notification.type)}`}>
          {getEventIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-slate-200 leading-snug">{notification.message}</p>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(notification.id)
                }}
                className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={`Dismiss notification: ${notification.message}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Timestamp and Read Indicator */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400">{getRelativeTime(new Date(notification.timestamp))}</span>
            {!notification.read && (
              <span
                className="w-2 h-2 bg-blue-500 rounded-full"
                aria-label="Unread notification"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
