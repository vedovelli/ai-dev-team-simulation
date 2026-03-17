import { useEffect, useRef, useState, useCallback } from 'react'
import { useNotificationCenter as useNotifications } from '../../hooks/useNotificationCenter'
import { useNotificationCenter as useNotificationPanel } from '../../contexts/NotificationCenterProvider'
import type { NotificationFilter } from '../../types/notification'
import { NotificationItem } from './NotificationItem'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

/**
 * Loading skeleton component for notification items
 */
function NotificationSkeleton() {
  return (
    <div className="px-4 py-3 border-b animate-pulse">
      <div className="flex gap-3">
        <div className="w-2 h-2 bg-slate-200 rounded-full mt-1 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mb-4 text-4xl">✨</div>
      <h3 className="text-slate-900 font-medium mb-1">You're all caught up!</h3>
      <p className="text-sm text-slate-500">No notifications yet</p>
    </div>
  )
}

/**
 * Error state component with retry button
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="px-6 py-12 text-center" role="alert">
      <div className="mb-4 text-4xl">⚠️</div>
      <h3 className="text-slate-900 font-medium mb-1">Failed to load notifications</h3>
      <p className="text-sm text-slate-500 mb-4">Something went wrong. Please try again.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Retry loading notifications"
      >
        Retry
      </button>
    </div>
  )
}

/**
 * NotificationDropdown displays a panel with up to 20 most recent notifications
 * Appears below the notification bell icon with smooth fade/slide animation
 *
 * Features:
 * - Shows up to 20 most recent notifications
 * - Filter toggle: All / Unread
 * - Dropdown panel positioned absolutely relative to bell
 * - Smooth open/close fade and scale animations
 * - Click-outside, Escape, and bell-click close handlers
 * - Max height with scrollable content
 * - Header with "Mark all as read" and filter controls
 * - Footer with "View all notifications" and "Clear all read" buttons
 * - Error state with retry capability
 * - Keyboard navigation: Escape to close, arrow keys to navigate items
 * - Responsive: full-width on mobile, fixed-width on desktop
 * - Accessible with proper ARIA labels and keyboard navigation
 */
export function NotificationDropdown({
  isOpen,
  onClose,
  className = '',
}: NotificationDropdownProps) {
  const {
    notifications,
    isLoading,
    isError,
    refetch,
    markAsRead,
    markMultipleAsRead,
    dismissAllReadNotifications,
  } = useNotifications()
  const { openPanel } = useNotificationPanel()

  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [focusedIndex, setFocusedIndex] = useState<number>(0)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const notificationItemsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  // Get up to 20 most recent notifications
  const recentNotifications = filteredNotifications.slice(0, 20)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Arrow key navigation through notification items
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prevIndex) => {
          let nextIndex = prevIndex
          if (e.key === 'ArrowDown') {
            nextIndex = Math.min(prevIndex + 1, recentNotifications.length - 1)
          } else {
            nextIndex = Math.max(prevIndex - 1, 0)
          }
          return nextIndex
        })
      }

      // Focus trap: cycle through focusable elements with Tab
      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll(
          'button, a, [tabindex]:not([tabindex="-1"])'
        )
        const focusArray = Array.from(focusableElements) as HTMLElement[]

        if (focusArray.length === 0) return

        const currentFocus = document.activeElement
        const focusedIndex = focusArray.indexOf(currentFocus as HTMLElement)

        if (e.shiftKey) {
          // Shift + Tab
          if (focusedIndex === 0) {
            e.preventDefault()
            focusArray[focusArray.length - 1].focus()
          }
        } else {
          // Tab
          if (focusedIndex === focusArray.length - 1) {
            e.preventDefault()
            focusArray[0].focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, recentNotifications.length])

  // Focus notification item when focused index changes
  useEffect(() => {
    if (recentNotifications.length > 0 && notificationItemsRef.current[focusedIndex]) {
      notificationItemsRef.current[focusedIndex]?.focus()
    }
  }, [focusedIndex, recentNotifications.length])

  // Reset focus when filter changes
  useEffect(() => {
    setFocusedIndex(0)
  }, [filter])

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length
  const readCount = notifications.filter((n) => n.read).length

  const handleMarkAllAsRead = async () => {
    const unreadIds = filteredNotifications
      .filter((n) => !n.read)
      .map((n) => n.id)

    if (unreadIds.length > 0) {
      await markMultipleAsRead(unreadIds)
    }
  }

  return (
    <>
      {/* Backdrop for focus containment */}
      <div
        className="fixed inset-0 z-40"
        ref={dropdownRef}
        aria-hidden="true"
      />

      {/* Dropdown Panel with fade + scale animation */}
      <div
        ref={panelRef}
        className={`absolute right-0 top-full mt-2 w-full sm:w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-[600px] flex flex-col transform transition-all duration-200 ease-out animate-in fade-in zoom-in-95 origin-top-right ${className}`}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {notifications.length > 0 && !isLoading && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                aria-label="Mark all notifications as read"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              aria-pressed={filter === 'all'}
              aria-label={`All notifications (${notifications.length})`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              aria-pressed={filter === 'unread'}
              aria-label={`Unread notifications (${unreadCount})`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto"
          role="region"
          aria-label="Notification list"
          aria-live="polite"
        >
          {isError ? (
            <ErrorState onRetry={() => refetch?.()} />
          ) : isLoading && recentNotifications.length === 0 ? (
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          ) : recentNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div role="list">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id} role="listitem">
                  <NotificationItem
                    ref={(el) => {
                      notificationItemsRef.current[index] = el
                    }}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    isFocused={focusedIndex === index}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex-shrink-0 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              openPanel()
              onClose()
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
            aria-label="View all notifications"
          >
            View all
          </button>

          {readCount > 0 && !isLoading && (
            <button
              onClick={dismissAllReadNotifications}
              className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
              aria-label="Clear all read notifications"
            >
              Clear read
            </button>
          )}
        </div>
      </div>
    </>
  )
}
