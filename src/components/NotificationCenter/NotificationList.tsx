import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import type { Notification } from '../../types/notification'
import { NotificationItemWithCheckbox } from './NotificationItemWithCheckbox'

interface NotificationListProps {
  notifications: Notification[]
  selectedIds: Set<string>
  onSelectionChange: (id: string, selected: boolean) => void
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
}

/**
 * Virtualized list for notifications
 *
 * Features:
 * - Virtual scrolling for performance (handles 50+ items efficiently)
 * - Selection checkboxes
 * - Item actions (mark as read, archive)
 * - Empty state handling
 * - Loading skeleton
 */
export function NotificationList({
  notifications,
  selectedIds,
  onSelectionChange,
  onMarkAsRead,
  onArchive,
  isLoading,
  isEmpty,
  emptyMessage = 'No notifications yet',
}: NotificationListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90, // Estimated height of each notification item
    overscan: 10, // Render 10 items beyond visible range
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems?.[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - (virtualItems?.[virtualItems.length - 1]?.end ?? 0) : 0

  // Skeleton loader
  const renderSkeleton = () => (
    <div className="space-y-3 px-3 py-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="h-4 w-4 bg-gray-200 rounded flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-2 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )

  if (isLoading) {
    return <div className="flex-1 overflow-hidden">{renderSkeleton()}</div>
  }

  if (isEmpty || notifications.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-4">
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
        <p className="text-sm font-medium text-gray-900">{emptyMessage}</p>
        <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto overflow-x-hidden"
    >
      <div style={{ height: `${totalSize}px` }}>
        {paddingTop > 0 && <div style={{ height: `${paddingTop}px` }} />}

        {virtualItems.map((virtualItem) => {
          const notification = notifications[virtualItem.index]
          if (!notification) return null

          return (
            <div key={notification.id} data-index={virtualItem.index}>
              <NotificationItemWithCheckbox
                notification={notification}
                isSelected={selectedIds.has(notification.id)}
                onSelectionChange={onSelectionChange}
                onMarkAsRead={onMarkAsRead}
                onArchive={onArchive}
              />
            </div>
          )
        })}

        {paddingBottom > 0 && <div style={{ height: `${paddingBottom}px` }} />}
      </div>
    </div>
  )
}
