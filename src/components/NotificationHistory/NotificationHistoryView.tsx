import React, { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  useNotificationHistory,
  type NotificationHistoryEntry,
  type NotificationHistoryFilters,
} from '../../hooks/useNotificationHistory'

/**
 * Relative time formatter
 */
function getRelativeTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`

  return past.toLocaleDateString()
}

/**
 * Column helper for type safety with TanStack Table
 */
const columnHelper = createColumnHelper<NotificationHistoryEntry>()

/**
 * Default columns for notification history table
 */
const defaultColumns: ColumnDef<NotificationHistoryEntry, any>[] = [
  columnHelper.accessor('message', {
    header: 'Message',
    cell: (info) => <div className="truncate">{info.getValue()}</div>,
    size: 300,
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info) => {
      const type = info.getValue()
      const typeClass =
        type === 'deadline_approaching'
          ? 'text-red-600'
          : type === 'sprint_updated'
            ? 'text-blue-600'
            : type === 'task_reassigned'
              ? 'text-purple-600'
              : 'text-gray-600'

      return <span className={`text-xs font-medium ${typeClass}`}>{type}</span>
    },
    size: 150,
  }),
  columnHelper.accessor('read', {
    header: 'Status',
    cell: (info) => {
      const isRead = info.getValue()
      return (
        <span
          className={`text-xs font-semibold ${isRead ? 'text-gray-500' : 'text-blue-600'}`}
        >
          {isRead ? 'Read' : 'Unread'}
        </span>
      )
    },
    size: 80,
  }),
  columnHelper.accessor('timestamp', {
    header: 'Date',
    cell: (info) => {
      const timestamp = info.getValue()
      return (
        <span className="text-xs text-gray-600" title={timestamp}>
          {getRelativeTime(timestamp)}
        </span>
      )
    },
    size: 100,
  }),
]

/**
 * Props for NotificationHistoryView
 */
interface NotificationHistoryViewProps {
  /** Initial filters to apply */
  filters?: NotificationHistoryFilters
  /** Pagination limit per page */
  limit?: number
  /** Custom columns for table (optional) */
  columns?: ColumnDef<NotificationHistoryEntry, any>[]
  /** Additional CSS classes */
  className?: string
}

/**
 * Notification History View Component
 *
 * Displays a paginated table of notification history with:
 * - Sortable columns using TanStack Table
 * - Cursor-based pagination
 * - Filtering by type, status, and date range
 * - Loading and empty states
 * - Responsive design
 *
 * @example
 * ```tsx
 * <NotificationHistoryView
 *   filters={{
 *     type: 'assignment_changed',
 *     status: 'unread',
 *   }}
 *   limit={20}
 * />
 * ```
 */
export function NotificationHistoryView({
  filters,
  limit = 20,
  columns = defaultColumns,
  className = '',
}: NotificationHistoryViewProps) {
  const [currentFilters, setCurrentFilters] =
    useState<NotificationHistoryFilters>(filters || {})
  const [currentCursor, setCurrentCursor] = useState<string | null>(null)

  // Fetch notification history with current filters
  const { items, pagination, totalCount, unreadCount, isLoading, error, fetchPage } =
    useNotificationHistory({
      limit,
      filters: currentFilters,
    })

  // Setup TanStack Table
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: {
      pagination: {
        pageIndex: 0,
        pageSize: limit,
      },
    },
  })

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters: Partial<NotificationHistoryFilters>) => {
    setCurrentFilters({ ...currentFilters, ...newFilters })
    setCurrentCursor(null) // Reset cursor when filters change
  }

  /**
   * Handle next page
   */
  const handleNextPage = async () => {
    if (pagination.nextCursor) {
      const nextData = await fetchPage(pagination.nextCursor)
      setCurrentCursor(pagination.nextCursor)
    }
  }

  /**
   * Handle previous page
   */
  const handlePreviousPage = () => {
    setCurrentCursor(null) // Go back to first page
  }

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 ${className}`}
      >
        <div className="text-center">
          <div className="mb-2 inline-block animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" style={{ width: '24px', height: '24px' }} />
          <p className="text-sm text-gray-600">Loading notification history...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
      >
        <h3 className="font-semibold text-red-900">Failed to load history</h3>
        <p className="text-sm text-red-700">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={`flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 ${className}`}
      >
        <div className="text-center">
          <p className="text-sm text-gray-600">No notification history found</p>
          {Object.keys(currentFilters).length > 0 && (
            <button
              onClick={() => {
                setCurrentFilters({})
                setCurrentCursor(null)
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {/* Type filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Type
            </label>
            <select
              value={currentFilters.type || ''}
              onChange={(e) =>
                handleFilterChange({
                  type: e.target.value
                    ? (e.target.value as any)
                    : undefined,
                })
              }
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            >
              <option value="">All types</option>
              <option value="assignment_changed">Assignment Changed</option>
              <option value="sprint_updated">Sprint Updated</option>
              <option value="task_reassigned">Task Reassigned</option>
              <option value="deadline_approaching">Deadline Approaching</option>
              <option value="agent_event">Agent Event</option>
              <option value="sprint_completed">Sprint Completed</option>
              <option value="comment_added">Comment Added</option>
              <option value="status_changed">Status Changed</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Status
            </label>
            <select
              value={currentFilters.status || 'all'}
              onChange={(e) =>
                handleFilterChange({
                  status: e.target.value as 'read' | 'unread' | 'all',
                })
              }
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Start date filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              From
            </label>
            <input
              type="date"
              value={currentFilters.startDate?.split('T')[0] || ''}
              onChange={(e) => {
                if (e.target.value) {
                  const date = new Date(e.target.value)
                  handleFilterChange({
                    startDate: date.toISOString().split('T')[0] + 'T00:00:00Z',
                  })
                } else {
                  handleFilterChange({ startDate: undefined })
                }
              }}
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            />
          </div>

          {/* End date filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              To
            </label>
            <input
              type="date"
              value={currentFilters.endDate?.split('T')[0] || ''}
              onChange={(e) => {
                if (e.target.value) {
                  const date = new Date(e.target.value)
                  date.setHours(23, 59, 59, 999)
                  handleFilterChange({
                    endDate: date.toISOString(),
                  })
                } else {
                  handleFilterChange({ endDate: undefined })
                }
              }}
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{items.length}</span> of{' '}
          <span className="font-semibold">{totalCount}</span> notifications (
          <span className="font-semibold">{unreadCount}</span> unread)
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={!currentCursor}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!pagination.hasMore}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

