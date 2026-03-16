import { useState } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, SortingState } from '@tanstack/react-table'
import type { Notification } from '../../types/notification'
import { NotificationItem } from './NotificationItem'

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  isError: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  tab: 'all' | 'unread'
  hasSelectableNotifications: boolean
}

/**
 * NotificationList
 *
 * Displays notifications in a table-like format with:
 * - Sortable columns (by timestamp)
 * - Multi-select checkboxes
 * - Individual and bulk actions
 * - Empty, loading, and error states
 * - TanStack Table for state management
 */
export function NotificationList({
  notifications,
  isLoading,
  isError,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onMarkAsRead,
  onDismiss,
  tab,
  hasSelectableNotifications,
}: NotificationListProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }])

  // TanStack Table for state management and sorting
  const columns: ColumnDef<Notification>[] = [
    {
      id: 'message',
      accessorKey: 'message',
      header: 'Message',
    },
    {
      id: 'timestamp',
      accessorKey: 'timestamp',
      header: 'Time',
    },
    {
      id: 'actions',
      header: 'Actions',
    },
  ]

  const table = useReactTable({
    data: notifications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  })

  // Sort notifications based on table state
  const sortedNotifications = table.getRowModel().rows.map((row) => row.original)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load notifications</p>
          <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-600 font-medium">
            No {tab === 'unread' ? 'unread' : ''} notifications
          </p>
          <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {sortedNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          isSelected={selectedIds.has(notification.id)}
          onToggleSelect={onToggleSelect}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
