import { useState } from 'react'
import type { NotificationType } from '../NotificationToast/NotificationToast'

interface Notification {
  id: string
  message: string
  type: NotificationType
  read: boolean
  timestamp: Date
  category?: 'agent' | 'sprint' | 'alert'
}

interface NotificationListProps {
  notifications?: Notification[]
  isLoading?: boolean
  onMarkAsRead?: (id: string) => void
}

type FilterType = 'all' | 'agent' | 'sprint' | 'alert'

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

const getCategoryLabel = (category?: string): string => {
  const labels: Record<string, string> = {
    agent: 'Agent',
    sprint: 'Sprint',
    alert: 'Alert',
  }
  return category && category in labels ? labels[category] : 'All'
}

export function NotificationList({
  notifications = [],
  isLoading = false,
  onMarkAsRead,
}: NotificationListProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter((n) => n.category === filter)

  const unreadCount = filteredNotifications.filter((n) => !n.read).length

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 sm:px-6 py-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Notifications</h2>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'agent', 'sprint', 'alert'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {getCategoryLabel(f === 'all' ? undefined : f)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-200">
        {isLoading ? (
          <div className="px-4 sm:px-6 py-8 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-blue-600" />
              <p className="text-sm text-slate-600">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 text-center">
            <p className="text-sm text-slate-500">
              {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {filteredNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" aria-label="Unread" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${getTypeBadgeColor(
                          notification.type,
                        )}`}
                      >
                        {getTypeLabel(notification.type)}
                      </span>
                      {notification.category && notification.category !== 'alert' && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
                          {getCategoryLabel(notification.category)}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto flex-shrink-0">
                        {new Date(notification.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className={`text-sm ${!notification.read ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && onMarkAsRead && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="flex-shrink-0 ml-2 p-1 hover:bg-slate-200 rounded transition-colors"
                      aria-label="Mark as read"
                    >
                      <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer stats */}
      {filteredNotifications.length > 0 && (
        <div className="border-t border-slate-200 px-4 sm:px-6 py-3 bg-slate-50">
          <p className="text-sm text-slate-600">
            {unreadCount > 0
              ? `${unreadCount} unread ${filter === 'all' ? 'notification' : filter} ${unreadCount === 1 ? '' : 's'}`
              : 'All caught up!'}
          </p>
        </div>
      )}
    </div>
  )
}
