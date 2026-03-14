import { useRef, useEffect, useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

export interface NotificationCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * NotificationCenterModal Component
 *
 * Modal panel showing user notifications with:
 * - Filter toggle (All / Unread)
 * - Mark individual as read
 * - Mark all as read button
 * - Dismiss button for each notification
 * - Empty state and loading states
 * - Notification categories with icons
 * - Relative timestamps
 *
 * Features:
 * - Keyboard accessible (Escape to close, arrow keys to navigate)
 * - Focus trap when modal is open
 * - Optimistic UI updates via useNotifications mutations
 * - Loading skeleton while fetching
 * - Empty state when no notifications
 */
export function NotificationCenterModal({ isOpen, onClose }: NotificationCenterModalProps) {
  const [filterUnread, setFilterUnread] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const notificationRefs = useRef<(HTMLDivElement | null)[]>([])

  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markMultipleAsRead,
    dismissNotification,
  } = useNotifications({
    refetchInterval: 30 * 1000,
  })

  // Handle keyboard navigation (Escape, Arrow Up/Down)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          onClose()
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex((prev) => {
            const nextIndex = prev + 1
            return nextIndex < notificationRefs.current.length ? nextIndex : prev
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Tab':
          // Implement focus trap for modal
          const focusableElements = panelRef.current?.querySelectorAll(
            'button, [role="menuitem"]'
          ) as NodeListOf<HTMLElement>
          if (!focusableElements || focusableElements.length === 0) return

          const firstElement = focusableElements[0]
          const lastElement = focusableElements[focusableElements.length - 1]

          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault()
              lastElement.focus()
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault()
              firstElement.focus()
            }
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Focus management - move focus to close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Focus on notification item when arrow key navigates
  useEffect(() => {
    if (focusedIndex >= 0 && notificationRefs.current[focusedIndex]) {
      notificationRefs.current[focusedIndex]?.focus()
    }
  }, [focusedIndex])

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      try {
        await markMultipleAsRead(unreadIds)
      } catch (error) {
        console.error('Failed to mark all as read:', error)
      }
    }
  }

  const handleDismiss = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId)
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }

  const handleDismissAllRead = async () => {
    const readIds = notifications.filter((n) => n.read).map((n) => n.id)
    if (readIds.length > 0) {
      try {
        await Promise.all(readIds.map((id) => dismissNotification(id)))
      } catch (error) {
        console.error('Failed to dismiss all read notifications:', error)
      }
    }
  }

  // Filter notifications based on filter state
  const displayedNotifications = filterUnread
    ? notifications.filter((n) => !n.read)
    : notifications

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Modal Panel */}
      <div
        ref={panelRef}
        className={`
          fixed right-0 top-16 bottom-0 w-96 bg-white shadow-xl z-40
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col border-l border-slate-200
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div>
            <h2 id="notification-center-title" className="font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {unreadCount} unread
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close notification center"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Action Bar */}
        <div className="border-b border-gray-200 px-4 py-3 space-y-2">
          {/* Mark all as read button */}
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
            >
              Mark all as read
            </button>
          )}

          {/* Filter Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterUnread(false)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !filterUnread
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterUnread
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="animate-spin w-6 h-6 mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-4">
              <p className="text-sm text-red-600">Failed to load notifications</p>
            </div>
          )}

          {!isLoading && !error && displayedNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 px-4">
              <svg
                className="w-12 h-12 text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V5a2 2 0 00-2-2H6a2 2 0 00-2 2v8"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900">
                {filterUnread ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </div>
          )}

          {!isLoading && !error && displayedNotifications.length > 0 && (
            <div className="divide-y divide-gray-200">
              {displayedNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  ref={(el) => {
                    notificationRefs.current[index] = el
                  }}
                  className="relative outline-none focus-within:bg-blue-50 transition-colors"
                  tabIndex={-1}
                  role="menuitem"
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    aria-label="Dismiss notification"
                    title="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && notifications.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 text-center">
            <button
              onClick={handleDismissAllRead}
              disabled={notifications.filter((n) => n.read).length === 0}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Dismiss all read
            </button>
          </div>
        )}
      </div>
    </>
  )
}
