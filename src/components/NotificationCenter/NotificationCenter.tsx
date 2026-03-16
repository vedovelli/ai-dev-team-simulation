import { useForm } from '@tanstack/react-form'
import type { Notification, NotificationType } from '../../types/notification'
import type { UseNotificationCenterReturn } from '../../hooks/useNotificationCenter'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'

/**
 * Notification item display component
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={`px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
        notification.read ? 'bg-white' : 'bg-blue-50'
      }`}
      role="article"
      aria-label={notification.message}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium break-words">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </span>
            {notification.priority === 'high' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                High Priority
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs text-blue-600 hover:text-blue-900 font-medium"
              aria-label={`Mark ${notification.message} as read`}
            >
              Read
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="text-xs text-gray-500 hover:text-red-600 font-medium"
            aria-label={`Delete ${notification.message}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Notification group header
 */
function GroupHeader({ groupKey }: { groupKey: string }) {
  const [type, date] = groupKey.split('::')
  return (
    <div className="sticky top-0 bg-gray-100 px-4 py-2 z-10 border-b">
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {type} • {date}
      </h3>
    </div>
  )
}

/**
 * Filter controls using TanStack Form
 */
function FilterControls({
  filterStatus,
  filterType,
  onFilterStatusChange,
  onFilterTypeChange,
  onClearFilters,
  unreadCount,
  total,
}: {
  filterStatus: string
  filterType: NotificationType | null
  onFilterStatusChange: (status: 'all' | 'unread') => void
  onFilterTypeChange: (type: NotificationType | null) => void
  onClearFilters: () => void
  unreadCount: number
  total: number
}) {
  const form = useForm({
    defaultValues: {
      status: filterStatus,
      type: filterType || '',
    },
  })

  return (
    <form className="px-4 py-3 border-b bg-gray-50">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Filter:
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'unread')}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by read status"
          >
            <option value="all">All ({total})</option>
            <option value="unread">Unread ({unreadCount})</option>
          </select>
        </div>

        {filterStatus !== 'all' || filterType ? (
          <button
            onClick={onClearFilters}
            type="button"
            className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        ) : null}
      </div>
    </form>
  )
}

/**
 * Notification Center panel component
 *
 * Displays grouped notifications with filtering and management controls
 * - Grouped by type and date
 * - Filter by unread/all status
 * - Mark individual or all as read
 * - Delete notifications
 * - Empty state when no notifications
 * - Accessible keyboard navigation and ARIA labels
 */
export function NotificationCenter({
  useNotificationCenterHook = useNotificationCenter,
}: { useNotificationCenterHook?: typeof useNotificationCenter } = {}) {
  const {
    notifications,
    unreadCount,
    total,
    filterStatus,
    filterType,
    setFilterStatus,
    setFilterType,
    clearFilters,
    groupedNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissAllReadNotifications,
    isLoading,
    isError,
    error,
  } = useNotificationCenterHook()

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block">
          <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
        <p className="mt-3 text-gray-600">Loading notifications...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-800">
          {error?.message || 'Failed to load notifications'}
        </p>
      </div>
    )
  }

  const hasFiltersApplied = filterStatus !== 'all' || filterType !== null

  return (
    <div
      className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm"
      role="region"
      aria-label="Notification center"
      aria-live="polite"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {unreadCount} unread
            </span>
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-blue-600 hover:text-blue-900 font-medium"
              aria-label="Mark all notifications as read"
            >
              Mark all read
            </button>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <FilterControls
        filterStatus={filterStatus}
        filterType={filterType}
        onFilterStatusChange={setFilterStatus}
        onFilterTypeChange={setFilterType}
        onClearFilters={clearFilters}
        unreadCount={unreadCount}
        total={total}
      />

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              {hasFiltersApplied ? 'No notifications match your filters' : 'You\'re all caught up!'}
            </p>
            {hasFiltersApplied && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-600 hover:text-blue-900"
                aria-label="Clear filters to see all notifications"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {Array.from(groupedNotifications.entries()).map(([groupKey, groupNotifications]) => (
              <div key={groupKey}>
                <GroupHeader groupKey={groupKey} />
                <div>
                  {groupNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {notifications.length > 0 && unreadCount === 0 && (
        <div className="px-4 py-3 border-t bg-gray-50 flex gap-2">
          <button
            onClick={() => dismissAllReadNotifications()}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            aria-label="Clear all read notifications"
          >
            Clear read notifications
          </button>
        </div>
      )}
    </div>
  )
}

export type NotificationCenterProps = React.ComponentProps<typeof NotificationCenter>
