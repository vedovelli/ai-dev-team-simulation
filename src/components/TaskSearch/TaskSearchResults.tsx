import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import type { SearchTask } from '../../types/task-search'

interface TaskSearchResultsProps {
  results: SearchTask[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry?: () => void
  currentPage: number
  totalPages: number
  totalResults: number
  onPageChange: (page: number) => void
}

const defaultColumns: ColumnDef<SearchTask>[] = [
  {
    accessorKey: 'title',
    header: 'Task',
    cell: (info) => (
      <div className="font-medium text-white">{info.getValue() as string}</div>
    ),
  },
  {
    accessorKey: 'sprint',
    header: 'Sprint',
    cell: (info) => (
      <span className="text-slate-300 text-sm">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'assignee',
    header: 'Agent',
    cell: (info) => (
      <span className="text-slate-300 text-sm">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue() as string
      const statusColors: Record<string, string> = {
        'in-progress': 'bg-yellow-900/30 text-yellow-200',
        done: 'bg-green-900/30 text-green-200',
        'in-review': 'bg-blue-900/30 text-blue-200',
        backlog: 'bg-slate-700 text-slate-300',
      }
      return (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[status] || 'bg-slate-700 text-slate-300'
          }`}
        >
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: (info) => {
      const priority = info.getValue() as string
      const priorityColors: Record<string, string> = {
        high: 'text-red-400',
        medium: 'text-yellow-400',
        low: 'text-blue-400',
      }
      return (
        <span className={`text-sm font-medium ${priorityColors[priority] || ''}`}>
          {priority}
        </span>
      )
    },
  },
]

export function TaskSearchResults({
  results,
  isLoading,
  isError,
  error,
  onRetry,
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
}: TaskSearchResultsProps) {
  const table = useReactTable({
    data: results,
    columns: defaultColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-slate-400 mb-3">Loading results...</div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-slate-700 rounded-full w-16" />
              <div className="h-6 bg-slate-700 rounded-full w-20" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-700 rounded w-24" />
              <div className="h-3 bg-slate-700 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/20 p-4">
        <div className="flex items-start gap-3">
          <div className="text-red-400 mt-0.5">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-300 mb-1">Search Error</h3>
            <p className="text-sm text-red-200 mb-3">
              {error?.message || 'Failed to fetch search results'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-12 h-12 text-slate-600 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p className="text-slate-400 font-medium mb-1">No tasks found</p>
        <p className="text-slate-500 text-sm">
          Try adjusting your search terms or filters
        </p>
      </div>
    )
  }

  // Results table
  return (
    <div className="space-y-4">
      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} found
        </p>
        <p className="text-sm text-slate-500">
          Page {currentPage} of {totalPages}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 border-b border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left font-semibold text-slate-300"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700'
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
