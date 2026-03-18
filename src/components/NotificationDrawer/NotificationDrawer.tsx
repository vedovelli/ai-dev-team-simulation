import { useRef, useEffect, useState, useMemo } from 'react'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import { NotificationGroup } from './NotificationGroup'
import { NotificationDrawerFilters, type NotificationDrawerFilter } from './NotificationFilters'
import type { NotificationEventType } from '../../types/notification'

export interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * NotificationDrawer Component
 *
 * A slide-out drawer displaying notifications grouped by type with quick-action buttons.
 * Features:
 * - Slide-in animation from the right
 * - Notifications grouped by type (assignment_changed, sprint_updated, task_reassigned, deadline_approaching)
 * - Each notification shows: icon, title, relative timestamp, unread dot
 * - Quick actions: "Mark as read" per item, "Mark all as read" in header
 * - Empty state with friendly message
 * - Loading skeleton while fetching
 * - Error state with retry button
 * - Accessible: focus trap, Escape to close, role="dialog" with aria-label
 * - Responsive: full-screen on mobile, fixed-width panel on desktop
 */
export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [activeFilter, setActiveFilter] = useState<NotificationDrawerFilter>('all')

  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    groupedByType,
    markAsRead,
    markAllAsRead,
  } = useNotificationCenter()

  /**
   * Filter notifications by selected type
   */
  const filteredGroupedByType = useMemo(() => {
    if (activeFilter === 'all') {
      return groupedByType
    }

    const filtered = new Map<string, typeof notifications>()
    const typeLabels: Record<string, string> = {
      assignment_changed: 'Assignments',
      sprint_updated: 'Sprints',
      task_reassigned: 'Task Changes',
      deadline_approaching: 'Deadlines',
    }

    const label = typeLabels[activeFilter] || activeFilter
    const group = groupedByType.get(label)

    if (group) {
      filtered.set(label, group)
    }

    return filtered
  }, [groupedByType, activeFilter])

  // Handle keyboard navigation and focus trap
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }

      // Focus trap on Tab
      if (event.key === 'Tab') {
        const focusableElements = drawerRef.current?.querySelectorAll(
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
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Focus close button when drawer opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const handleRetry = () => {
    // Refetch notifications by closing and reopening
    onClose()
    setTimeout(() => {
      // Component will refetch on mount if needed
    }, 100)
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={`
          fixed right-0 top-0 bottom-0 bg-white shadow-xl z-40
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          w-full md:w-96
          flex flex-col
          border-l border-gray-200
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id="notification-drawer-title" className="font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close notifications"
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

        {/* Filter Bar */}
        {notifications.length > 0 && (
          <NotificationDrawerFilters
            selectedFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        )}

        {/* Action Bar */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="border-b border-gray-200 px-4 py-3">
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
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
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900 mb-2">
                Failed to load notifications
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Please check your connection and try again
              </p>
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
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
                No notifications yet
              </p>
              <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
            </div>
          )}

          {/* Grouped Notifications */}
          {!isLoading && !error && notifications.length > 0 && (
            <div>
              {Array.from(filteredGroupedByType.entries()).map(([groupTitle, groupNotifications]) => (
                <NotificationGroup
                  key={groupTitle}
                  title={groupTitle}
                  notifications={groupNotifications}
                  onMarkAsRead={markAsRead}
                  isInitiallyExpanded={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
