import { useState } from 'react'
import type { NotificationType } from '../NotificationToast/NotificationToast'

interface Notification {
  id: string
  message: string
  type: NotificationType
  read: boolean
  timestamp: Date
}

interface NotificationBannerProps {
  notifications?: Notification[]
  onMarkAllAsRead?: () => void
}

const getTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    info: 'Info',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
  }
  return labels[type]
}

const getTypeBadgeColor = (type: NotificationType): string => {
  switch (type) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800'
    case 'error':
      return 'bg-red-100 text-red-800'
    case 'warning':
      return 'bg-amber-100 text-amber-800'
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

export function NotificationBanner({
  notifications = [],
  onMarkAllAsRead,
}: NotificationBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  if (!notifications.length) {
    return null
  }

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <span className="text-sm font-bold text-blue-900">{unreadCount}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {unreadCount === 1 ? '1 unread notification' : `${unreadCount} unread notifications`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              aria-expanded={isExpanded}
              aria-label="Toggle notifications"
            >
              <svg
                className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded list */}
        {isExpanded && (
          <div className="border-t border-slate-200 py-2 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul className="space-y-1">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.read && (
                          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${getTypeBadgeColor(
                              notification.type,
                            )}`}
                          >
                            {getTypeLabel(notification.type)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(notification.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className={`text-sm ${notification.read ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
