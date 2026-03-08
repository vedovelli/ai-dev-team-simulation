import { useRef, useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TaskDistributionItem } from '../types/analytics'

interface TaskDistributionTableProps {
  data: TaskDistributionItem[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  isLoading?: boolean
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-300',
  high: 'bg-orange-900/30 text-orange-300',
  medium: 'bg-yellow-900/30 text-yellow-300',
  low: 'bg-blue-900/30 text-blue-300',
}

const statusColors: Record<string, string> = {
  todo: 'bg-slate-700/50 text-slate-300',
  in_progress: 'bg-blue-900/30 text-blue-300',
  review: 'bg-purple-900/30 text-purple-300',
  completed: 'bg-green-900/30 text-green-300',
}

/**
 * Task Distribution Table with TanStack Virtual
 * Renders large datasets efficiently with virtualization
 * Supports sorting, filtering, and pagination
 */
export function TaskDistributionTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onSort,
  isLoading = false,
}: TaskDistributionTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  // Define columns
  const columns: ColumnDef<TaskDistributionItem>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Task ID',
        cell: (info) => <span className="font-mono text-sm text-slate-400">{info.getValue()}</span>,
        size: 120,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => <span className="text-slate-300">{info.getValue()}</span>,
        size: 300,
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const priority = info.getValue() as string
          return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[priority] || 'bg-slate-700 text-slate-300'}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          )
        },
        size: 100,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string
          return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status] || 'bg-slate-700 text-slate-300'}`}>
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </span>
          )
        },
        size: 120,
      },
      {
        accessorKey: 'agentName',
        header: 'Assigned To',
        cell: (info) => <span className="text-slate-300">{info.getValue()}</span>,
        size: 180,
      },
      {
        accessorKey: 'duration',
        header: 'Duration (hours)',
        cell: (info) => {
          const duration = info.getValue()
          return <span className="text-slate-300">{duration ? `${duration}h` : '-'}</span>
        },
        size: 140,
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: (info) => {
          const date = info.getValue() as string | undefined
          if (!date) return <span className="text-slate-400">In Progress</span>
          return (
            <span className="text-slate-300">
              {new Date(date).toLocaleDateString()}
            </span>
          )
        },
        size: 140,
      },
    ],
    [],
  )

  // Setup table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
    onSortingChange: (newSorting) => {
      setSorting(newSorting)
      if (typeof newSorting === 'function') {
        const sorted = newSorting(sorting)
        if (sorted.length > 0) {
          onSort?.(sorted[0].id, sorted[0].desc ? 'desc' : 'asc')
        }
      } else if (newSorting.length > 0) {
        onSort?.(newSorting[0].id, newSorting[0].desc ? 'desc' : 'asc')
      }
    },
  })

  const { rows } = table.getRowModel()

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0
  const paddingBottom = virtualItems.length > 0
    ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Task Distribution</h3>
          <div className="text-sm text-slate-400">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} tasks
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ height: '500px' }}
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 bg-slate-900 cursor-pointer hover:bg-slate-800"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === 'desc' ? (
                          <span className="text-blue-400">↓</span>
                        ) : (
                          <span className="text-blue-400">↑</span>
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}

            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index]
              return (
                <tr
                  key={row.id}
                  style={{ height: `${virtualItem.size}px` }}
                  className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm"
                      style={{ width: `${cell.column.columnDef.size}px` }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Pagination */}
      <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center bg-slate-900/50">
        <div className="text-sm text-slate-400">
          Page {page} of {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page - 2 + i
            if (pageNum < 1 || pageNum > totalPages) return null
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
            className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
