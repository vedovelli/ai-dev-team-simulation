import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { NotificationType, Notification } from '../../types/notification'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationBell } from './NotificationBell'
import { NotificationList } from './NotificationList'

type TabType = 'all' | 'unread' | 'byType'

/**
 * NotificationCenterPanel Component
 *
 * Full notification center UI with:
 * - Tabbed interface (All, Unread, By Type)
 * - NotificationBell header with unread badge
 * - Mark-as-read functionality with optimistic updates
 * - Batch mark-all-as-read button
 * - Empty states per tab
 * - Loading skeletons
 * - Full accessibility with keyboard navigation and ARIA
 *
 * Features:
 * - Single source of truth: useNotifications hook manages state
 * - Click outside to close
 * - Escape key to close and refocus bell
 * - Notifications grouped by type in "By Type" tab
 * - Cache invalidation ensures badge and panel stay in sync
 */
export function NotificationCenterPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [markAllError, setMarkAllError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markMultipleAsRead,
  } = useNotifications({
    refetchInterval: 30 * 1000,
  })

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        bellRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read)
      case 'byType':
        // For byType, we still return all but they'll be displayed grouped
        return notifications
      case 'all':
      default:
        return notifications
    }
  }, [notifications, activeTab])

  // Group notifications by type for "By Type" tab
  const groupedByType = useMemo(() => {
    if (activeTab !== 'byType') return {} as Record<NotificationType, Notification[]>

    const groups: Record<NotificationType, Notification[]> = {} as Record<
      NotificationType,
      Notification[]
    >
    filteredNotifications.forEach((notif) => {
      if (!groups[notif.type]) {
        groups[notif.type] = []
      }
      groups[notif.type].push(notif)
    })
    return groups
  }, [filteredNotifications, activeTab])

  const handleMarkAsRead = useCallback((notificationId: string) => {
    markAsRead(notificationId)
  }, [markAsRead])

  const handleMarkAllAsRead = useCallback(async () => {
    setMarkAllError(null)
    const unreadIds = filteredNotifications
      .filter((n) => !n.read)
      .map((n) => n.id)
    if (unreadIds.length > 0) {
      try {
        await markMultipleAsRead(unreadIds)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to mark all as read'
        setMarkAllError(errorMessage)
      }
    }
  }, [filteredNotifications, markMultipleAsRead])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <NotificationBell
        ref={bellRef}
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-panel"
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-[600px] flex flex-col"
          role="dialog"
          aria-labelledby="notification-panel-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 id="notification-panel-title" className="font-semibold text-gray-900 mb-3">
              Notifications
            </h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  setActiveTab('all')
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-selected={activeTab === 'all'}
              >
                All
              </button>
              <button
                onClick={() => {
                  setActiveTab('unread')
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-selected={activeTab === 'unread'}
              >
                Unread
              </button>
              <button
                onClick={() => {
                  setActiveTab('byType')
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTab === 'byType'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-selected={activeTab === 'byType'}
              >
                By Type
              </button>
            </div>

            {/* Mark All As Read Button */}
            <div className="space-y-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
              {markAllError && (
                <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  {markAllError}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'byType' ? (
            // By Type Tab - Grouped Display
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="space-y-2 p-2">
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
              )}

              {error && (
                <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded">
                  Failed to load notifications. Please try again.
                </div>
              )}

              {!isLoading && !error && notifications.length === 0 && (
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
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}

              {!isLoading && !error && Object.keys(groupedByType).length > 0 && (
                <div className="divide-y divide-gray-200">
                  {Object.entries(groupedByType).map(([type, typeNotifications]) => (
                    <div key={type}>
                      <div className="px-4 py-2 bg-gray-50 font-medium text-xs text-gray-600 uppercase tracking-wider">
                        {type.replace(/_/g, ' ')}
                      </div>
                      <div className="divide-y divide-gray-200" role="list">
                        {typeNotifications.map((notification) => (
                          <div key={notification.id} role="listitem">
                            <div
                              className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex gap-2 items-start">
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {notification.timestamp
                                    ? new Date(notification.timestamp).toLocaleTimeString()
                                    : ''}
                                </span>
                                <span className="flex-1 text-sm text-gray-800">
                                  {notification.message}
                                </span>
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                    aria-label="Mark as read"
                                    title="Mark as read"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // All and Unread Tabs - Use NotificationList component
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoading}
              error={error}
              onMarkAsRead={handleMarkAsRead}
              emptyMessage={
                activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'
              }
            />
          )}

          {/* Footer */}
          {!isLoading && notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
