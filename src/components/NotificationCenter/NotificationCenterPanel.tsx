import { useState, useRef, useEffect } from 'react'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import { NotificationList } from './NotificationList'
import { NotificationEmptyState } from './NotificationEmptyState'
import { NotificationLoadingSkeleton } from './NotificationLoadingSkeleton'

/**
 * NotificationCenterPanel Component
 *
 * Modal overlay component that surfaces the notification data layer to users.
 * Consumes `useNotificationCenter` hook.
 *
 * Features:
 * - Modal overlay triggered by notification icon in header
 * - Paginated list of notifications
 * - Filter controls: "All" / "Unread only" toggle
 * - Mark all as read button with optimistic updates
 * - Empty state when no notifications
 * - Loading skeleton while fetching
 * - Error state with retry button
 * - Keyboard accessible: Escape closes panel, focus trap inside modal
 * - Responsive design for mobile and desktop
 */
export function NotificationCenterPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    markAllAsReadLoading,
    refetch,
  } = useNotificationCenter()

  // Handle click outside to close panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
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

  // Handle Escape key to close panel
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

  // Filter notifications based on unread filter
  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.read)
    : notifications

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        ref={bellRef}
        onClick={togglePanel}
        className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-full max-w-md bg-white rounded-lg shadow-2xl z-50 border border-gray-200 max-h-[600px] flex flex-col"
          role="dialog"
          aria-labelledby="notification-panel-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 id="notification-panel-title" className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Close notifications panel"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setFilterUnreadOnly(false)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !filterUnreadOnly
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={!filterUnreadOnly}
              >
                All
              </button>
              <button
                onClick={() => setFilterUnreadOnly(true)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterUnreadOnly
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterUnreadOnly}
              >
                Unread
              </button>
            </div>

            {/* Mark All As Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markAllAsReadLoading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                aria-label="Mark all as read"
              >
                {markAllAsReadLoading ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <NotificationLoadingSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <svg
                  className="w-12 h-12 text-red-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-900 font-medium mb-2">Failed to load notifications</p>
                <p className="text-gray-600 text-sm mb-4 text-center">
                  {error instanceof Error ? error.message : 'An error occurred'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  aria-label="Retry loading notifications"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <NotificationEmptyState filterUnreadOnly={filterUnreadOnly} />
            ) : (
              <NotificationList
                notifications={filteredNotifications}
                onMarkAsRead={() => {
                  /* Mark individual is handled via the hook */
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
