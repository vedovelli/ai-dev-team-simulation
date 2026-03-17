import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Notification } from '../../types/notification'
import type { UseInfiniteNotificationsReturn } from '../../hooks/useInfiniteNotifications'
import NotificationItem from './NotificationItem'

interface NotificationCenterProps {
  notifications: UseInfiniteNotificationsReturn
}

type NotificationWithSection = Notification & { section: 'unread' | 'read' }

/**
 * High-performance notification center with virtual scrolling and infinite scroll
 *
 * Features:
 * - TanStack Virtual for windowed rendering (only visible DOM nodes)
 * - Infinite scroll trigger at list bottom
 * - Loading spinner during next-page fetch
 * - Visual sections: unread (highlighted) vs read (muted)
 * - Empty state when no notifications
 */
export default function NotificationCenter({ notifications }: NotificationCenterProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Separate unread and read notifications
  const combinedNotifications = useMemo<NotificationWithSection[]>(() => {
    const unread = notifications.notifications.filter((n) => !n.read)
    const read = notifications.notifications.filter((n) => n.read)
    return [
      ...unread.map((n) => ({ ...n, section: 'unread' as const })),
      ...read.map((n) => ({ ...n, section: 'read' as const })),
    ]
  }, [notifications.notifications])

  // Virtual list for efficient rendering
  const virtualizer = useVirtualizer({
    count: combinedNotifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of notification item
    overscan: 10, // Overscan items for smoother scrolling
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Track last visible item for infinite scroll trigger
  const lastVisibleIndex = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1

  // Trigger fetch next page when scrolled near bottom
  useEffect(() => {
    if (
      lastVisibleIndex >= combinedNotifications.length - 5 && // Within 5 items of end
      notifications.hasNextPage &&
      !notifications.isFetchingNextPage
    ) {
      notifications.fetchNextPage()
    }
  }, [lastVisibleIndex, combinedNotifications.length, notifications.hasNextPage, notifications.isFetchingNextPage, notifications.fetchNextPage])

  // Use IntersectionObserver as alternate infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          notifications.hasNextPage &&
          !notifications.isFetchingNextPage
        ) {
          notifications.fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [notifications.hasNextPage, notifications.isFetchingNextPage, notifications.fetchNextPage])

  // Handle mark as read click
  const handleMarkAsRead = useCallback(
    (id: string) => {
      notifications.markAsRead(id)
    },
    [notifications.markAsRead]
  )

  // Handle delete notification
  const handleDelete = useCallback(
    (id: string) => {
      // Delete functionality would be implemented via notifications.deleteNotification
      // For now, this is a placeholder for the UI
      console.log('Delete notification:', id)
    },
    []
  )

  // Empty state
  if (combinedNotifications.length === 0 && !notifications.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-500">No notifications yet</p>
      </div>
    )
  }

  // Loading initial data
  if (notifications.isLoading && combinedNotifications.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        <p className="mt-4 text-sm text-gray-500">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="relative h-full overflow-y-auto bg-white"
    >
      <div style={{ height: totalSize + 'px' }} className="relative">
        {virtualItems.map((virtualItem) => {
          const notif = combinedNotifications[virtualItem.index]
          const isUnread = notif.section === 'unread'
          const isFirstReadItem =
            virtualItem.index > 0 &&
            combinedNotifications[virtualItem.index - 1].section === 'unread'

          return (
            <div key={virtualItem.key}>
              {/* Section divider: read notifications */}
              {isFirstReadItem && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Earlier</p>
                </div>
              )}

              <div
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="absolute inset-x-0"
              >
                <NotificationItem
                  notification={notif}
                  isUnread={isUnread}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading indicator for next page */}
      {notifications.isFetchingNextPage && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            <span className="text-sm text-gray-600">Loading more notifications...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {notifications.isError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            Failed to load notifications. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}
