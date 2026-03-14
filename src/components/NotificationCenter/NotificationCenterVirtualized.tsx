import { useState, useRef, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '../../types/notification'

type GroupingMode = 'date' | 'type' | 'none'

/**
 * NotificationCenterVirtualized Component
 *
 * A performance-optimized notification center with:
 * - Virtual scrolling for 100+ notifications without jank
 * - Grouping by date or type with toggle
 * - Filter toggle (All / Unread)
 * - Mark individual as read
 * - Mark all as read button
 * - Empty state and loading states
 * - Type-specific icons and formatting
 *
 * Uses @tanstack/react-virtual for efficient rendering of large lists.
 * Virtual scrolling only renders visible items, dramatically improving performance.
 */
export function NotificationCenterVirtualized() {
  const [isOpen, setIsOpen] = useState(false)
  const [filterUnread, setFilterUnread] = useState(false)
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('date')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    badgeCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    groupedByDate,
    groupedByType,
  } = useNotificationCenter({
    refetchInterval: 30 * 1000,
    enableVirtualization: true,
    virtualWindowSize: 400,
  })

  // Filter notifications
  const displayedNotifications = useMemo(() => {
    return filterUnread ? notifications.filter((n) => !n.read) : notifications
  }, [notifications, filterUnread])

  // Get grouped notifications based on grouping mode
  const groupedNotifications = useMemo(() => {
    if (groupingMode === 'date') {
      return groupedByDate
    } else if (groupingMode === 'type') {
      return groupedByType
    }
    return new Map([['All Notifications', displayedNotifications]])
  }, [groupingMode, groupedByDate, groupedByType, displayedNotifications])

  // Flatten grouped notifications for virtualizer
  const flattenedItems = useMemo(() => {
    const items: Array<{ type: 'header'; label: string } | { type: 'notification'; data: Notification }> = []

    for (const [label, notifs] of groupedNotifications.entries()) {
      if (notifs.length === 0) continue
      items.push({ type: 'header', label })
      notifs.forEach((notif) => {
        items.push({ type: 'notification', data: notif })
      })
    }

    return items
  }, [groupedNotifications])

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
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
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge Count */}
        {badgeCount > 0 && (
          <span
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
            aria-label={`${unreadCount} unread notifications`}
          >
            {badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-[600px] flex flex-col"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="notification-button"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2 mb-2">
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

            {/* Grouping Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setGroupingMode('none')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  groupingMode === 'none'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="No grouping"
              >
                None
              </button>
              <button
                onClick={() => setGroupingMode('date')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  groupingMode === 'date'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Group by date"
              >
                Date
              </button>
              <button
                onClick={() => setGroupingMode('type')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  groupingMode === 'type'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Group by type"
              >
                Type
              </button>
            </div>
          </div>

          {/* Content Area with Virtual Scrolling */}
          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto"
            style={{ height: '400px' }}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin">
                  <svg
                    className="w-6 h-6 text-gray-600"
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
              </div>
            )}

            {error && (
              <div className="px-4 py-3 text-sm text-red-600 bg-red-50">
                Failed to load notifications
              </div>
            )}

            {!isLoading && !error && displayedNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <svg
                  className="w-12 h-12 text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-sm">{filterUnread ? 'No unread notifications' : 'No notifications yet'}</p>
              </div>
            )}

            {!isLoading && !error && displayedNotifications.length > 0 && (
              <div
                style={{
                  height: `${totalSize}px`,
                }}
              >
                {virtualItems.map((virtualItem) => {
                  const item = flattenedItems[virtualItem.index]
                  if (!item) return null

                  if (item.type === 'header') {
                    return (
                      <div
                        key={`header-${item.label}`}
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="sticky top-0 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide"
                      >
                        {item.label}
                      </div>
                    )
                  }

                  if (item.type === 'notification') {
                    return (
                      <div
                        key={item.data.id}
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <NotificationItem
                          notification={item.data}
                          onMarkAsRead={handleMarkAsRead}
                        />
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>

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
