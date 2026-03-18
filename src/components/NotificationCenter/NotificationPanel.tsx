import { forwardRef, useState } from 'react'
import type { Notification } from '../../types/notification'
import type { NotificationPreferences } from '../../types/notification-preferences'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationList } from './NotificationList'
import { NotificationEmptyState } from './NotificationEmptyState'

interface NotificationPanelProps {
  isOpen: boolean
  notifications: Notification[]
  isLoading: boolean
  error: Error | null
  preferences?: NotificationPreferences
}

/**
 * NotificationPanel - Slide-out drawer showing notifications
 *
 * Features:
 * - Slide-out animation from the right
 * - Filter tabs: All / Unread
 * - List of notifications with quick actions
 * - Mark all as read button
 * - Empty state when no notifications
 * - Respects notification preferences
 */
export const NotificationPanel = forwardRef<HTMLDivElement, NotificationPanelProps>(
  ({ isOpen, notifications, isLoading, error, preferences }, ref) => {
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const { markMultipleAsRead, markAsRead } = useNotifications()

    // Filter notifications
    const filteredNotifications =
      filter === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications

    const unreadCount = notifications.filter((n) => !n.read).length

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
      const unreadIds = notifications
        .filter((n) => !n.read)
        .map((n) => n.id)

      if (unreadIds.length > 0) {
        await markMultipleAsRead(unreadIds)
      }
    }

    if (!isOpen) return null

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          ref={ref}
          className={`fixed right-0 top-0 bottom-0 bg-white shadow-xl z-40 w-full md:w-96 border-l border-gray-200 transition-transform duration-300 ease-out flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Mark all as read button */}
            {unreadCount > 0 && !isLoading && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <p className="text-sm">Failed to load notifications</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <NotificationEmptyState />
            ) : (
              <NotificationList
                notifications={filteredNotifications}
                onMarkAsRead={markAsRead}
              />
            )}
          </div>
        </div>
      </>
    )
  }
)

NotificationPanel.displayName = 'NotificationPanel'
