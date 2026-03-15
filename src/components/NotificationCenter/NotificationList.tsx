import { CheckCircle } from 'lucide-react'
import type { Notification } from '../../types/notification'
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
 * Renders a scrollable list of notifications with:
 * - Loading skeleton while fetching data
 * - Error state with message
 * - Empty state when no notifications
 * - NotificationItem components for each notification
 * - Proper ARIA roles and semantics (role="list")
 * - Max height with overflow scrolling
 */
export function NotificationList({
  notifications,
  isLoading,
  error,
  onMarkAsRead,
  onDismiss,
  emptyMessage = "You're all caught up!",
}: NotificationListProps) {
  if (isLoading && notifications.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto divide-y divide-slate-200"
        aria-live="polite"
        aria-busy="true"
      >
        {/* Loading skeleton - 3 items */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 animate-pulse">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-slate-200 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && notifications.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-red-600 font-medium">Failed to load notifications</p>
          <p className="text-xs text-red-500 mt-1">Please try again later</p>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6">
        <div className="flex justify-center mb-3">
          <div className="p-2 bg-slate-100 rounded-full">
            <CheckCircle className="w-6 h-6 text-slate-400" />
          </div>
        </div>
        <h3 className="text-sm font-medium text-slate-900 mb-1">All caught up!</h3>
        <p className="text-xs text-slate-500 text-center">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto divide-y divide-slate-200"
      role="list"
      aria-label="Notifications list"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
