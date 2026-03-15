import type { Notification, NotificationType } from '../../types/notification'
import { NotificationItem } from './NotificationItem'

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  error: Error | null
  onMarkAsRead: (id: string) => void
  onDismiss?: (id: string) => void
  emptyMessage?: string
}

/**
 * NotificationList Component
 *
 * Renders a list of notifications with:
 * - Loading skeleton while fetching data
 * - Error state with message
 * - Empty state with custom message
 * - NotificationItem components for each notification
 * - Accessible markup with proper ARIA roles
 */
export function NotificationList({
  notifications,
  isLoading,
  error,
  onMarkAsRead,
  onDismiss,
  emptyMessage = 'You have no notifications',
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto" aria-live="polite" aria-busy="true">
        <div className="space-y-2 p-2">
          {/* Loading skeleton - 3 items */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-2 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded">
          Failed to load notifications. Please try again.
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
          <svg
            className="w-12 h-12 text-gray-300 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-gray-200" role="list">
        {notifications.map((notification) => (
          <div key={notification.id} role="listitem">
            <NotificationItem
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDismiss={onDismiss}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
