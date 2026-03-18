import type { Notification } from '../../types/notification'
import { getRelativeTime } from '../../lib/utils'
import { useNavigate } from '@tanstack/react-router'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
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
      return 'text-amber-500'
    case 'sprint_completed':
    case 'sprint_started':
      return 'text-emerald-500'
    case 'task_assigned':
    case 'task_reassigned':
    case 'assignment_changed':
      return 'text-blue-500'
    default:
      return 'text-gray-400'
  }
}

/**
 * Get navigation route based on notification type and metadata
 * Returns null if navigation is not available for this notification type
 */
function getNavigationRoute(notification: Notification): { to: string } | null {
  // Specific task navigation for task changes and deadlines
  if (
    notification.type === 'task_reassigned' ||
    notification.type === 'deadline_approaching'
  ) {
    const taskId = notification.metadata?.entityId || notification.relatedId
    if (taskId) {
      return { to: `/tasks/${taskId}` }
    }
  }

  // Sprint-related notifications navigate to sprint
  if (
    notification.type === 'sprint_started' ||
    notification.type === 'sprint_completed'
  ) {
    const sprintId = notification.metadata?.entityId || notification.relatedId
    if (sprintId) {
      return { to: `/dashboard/sprints/${sprintId}` }
    }
  }

  // Assignment-related notifications navigate to kanban board
  if (
    notification.type === 'task_assigned' ||
    notification.type === 'task_unassigned'
  ) {
    return { to: '/kanban' }
  }

  return null
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const navigate = useNavigate()

  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const handleNavigate = () => {
    handleMarkAsRead()
    const route = getNavigationRoute(notification)
    if (route) {
      navigate(route)
    }
  }

  const route = getNavigationRoute(notification)
  const isNavigable = route !== null

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 transition-colors ${isNavigable ? 'cursor-pointer' : ''} border-b border-gray-100 last:border-b-0 ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      role="menuitem"
      tabIndex={isNavigable ? 0 : -1}
      onClick={isNavigable ? handleNavigate : handleMarkAsRead}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (isNavigable) {
            handleNavigate()
          } else {
            handleMarkAsRead()
          }
        }
      }}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${getEventColor(notification.type)}`}>
          {getEventIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{notification.message}</p>

          {/* Timestamp and Read Indicator */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {getRelativeTime(new Date(notification.timestamp))}
            </span>
            {!notification.read && (
              <span
                className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                aria-label="Unread"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
