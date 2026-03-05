import { useRef, useMemo, useCallback, ReactNode, useEffect, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { UsePaginatedQueryResult } from '../../hooks/usePaginatedQuery'

export interface PaginatedDataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  query: UsePaginatedQueryResult<T>
  onSortingChange?: (sorting: SortingState) => void
  enableSorting?: boolean
  pageSizeOptions?: number[]
  estimateSize?: number
  overscan?: number
  rowClassName?: (row: T, index: number) => string
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: ReactNode
}

export function PaginatedDataTable<T extends Record<string, unknown>>({
  columns,
  query,
  onSortingChange,
  enableSorting = true,
  pageSizeOptions = [10, 25, 50, 100],
  estimateSize = 50,
  overscan = 10,
  rowClassName,
  emptyState,
  loadingState,
  errorState,
}: PaginatedDataTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [keyboardFocusIndex, setKeyboardFocusIndex] = useState(0)

  const table = useReactTable({
    data: query.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    state: {
      sorting,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      onSortingChange?.(newSorting)
    },
    manualPagination: true,
    manualSorting: enableSorting,
    rowCount: query.total,
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems?.[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems?.[virtualItems.length - 1]?.end ?? 0)
      : 0

  const handlePreviousPage = useCallback(() => {
    if (query.canPreviousPage) {
      query.previousPage()
    }
  }, [query])

  const handleNextPage = useCallback(() => {
    if (query.canNextPage) {
      query.nextPage()
    }
  }, [query])

  const handleFirstPage = useCallback(() => {
    query.goToPage(1)
  }, [query])

  const handleLastPage = useCallback(() => {
    query.goToPage(query.totalPages)
  }, [query])

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      query.setPageSize(newSize)
    },
    [query]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableContainerRef.current?.contains(document.activeElement)) {
        return
      }

      const rowCount = rows.length
      if (rowCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setKeyboardFocusIndex((prev) => Math.min(prev + 1, rowCount - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setKeyboardFocusIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          setKeyboardFocusIndex(0)
          break
        case 'End':
          e.preventDefault()
          setKeyboardFocusIndex(rowCount - 1)
          break
      }
    }

    tableContainerRef.current?.addEventListener('keydown', handleKeyDown)
    return () => {
      tableContainerRef.current?.removeEventListener('keydown', handleKeyDown)
    }
  }, [rows.length])

  const headerGroups = table.getHeaderGroups()
  const displayStart = query.data.length === 0 ? 0 : (query.page - 1) * query.pageSize + 1
  const displayEnd = Math.min(query.page * query.pageSize, query.total)

  // Render error state
  if (query.isError) {
    return (
      errorState || (
        <div
          className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8"
          role="alert"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600">
              {query.error?.message || 'Failed to load data. Please try again.'}
            </p>
          </div>
        </div>
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* Page Size and Info Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm font-medium text-slate-700">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={query.pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
            className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={query.isPending}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-600">
          Showing {displayStart} to {displayEnd} of {query.total}
        </div>
      </div>

      {/* Loading State */}
      {query.isPending && (
        loadingState || (
          <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-600">Loading data...</p>
            </div>
          </div>
        )
      )}

      {/* Empty State */}
      {!query.isPending && query.data.length === 0 && (
        emptyState || (
          <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
            <p className="text-slate-600">No data available</p>
          </div>
        )
      )}

      {/* Table */}
      {!query.isPending && query.data.length > 0 && (
        <>
          <div
            ref={tableContainerRef}
            className="rounded-lg border border-slate-200 overflow-auto"
            style={{ height: '500px' }}
            role="region"
            aria-label="Paginated data table with sorting and pagination"
            tabIndex={0}
          >
            <table
              className="w-full border-collapse"
              role="grid"
              aria-rowcount={query.total}
              aria-colcount={columns.length}
            >
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300">
                {headerGroups.map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300"
                        role="columnheader"
                        aria-sort={
                          header.column.getIsSorted()
                            ? header.column.getIsSorted() === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-2'
                                : ''
                            }
                            onClick={
                              header.column.getCanSort()
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span className="text-xs">
                                {header.column.getIsSorted() === 'asc'
                                  ? ' ↑'
                                  : header.column.getIsSorted() === 'desc'
                                    ? ' ↓'
                                    : ' ⇅'}
                              </span>
                            )}
                          </div>
                        )}
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
                  const isKeyboardFocused = virtualItem.index === keyboardFocusIndex

                  return (
                    <tr
                      key={row.id}
                      data-index={virtualItem.index}
                      className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                        isKeyboardFocused ? 'bg-blue-100' : ''
                      } ${rowClassName ? rowClassName(row.original, virtualItem.index) : ''}`}
                      style={{
                        height: `${virtualItem.size}px`,
                      }}
                      role="row"
                      aria-rowindex={(query.page - 1) * query.pageSize + virtualItem.index + 2}
                      tabIndex={isKeyboardFocused ? 0 : -1}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-slate-900"
                          role="gridcell"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Page {query.page} of {query.totalPages}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleFirstPage}
                disabled={!query.canPreviousPage || query.isPending}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
                title="First page"
              >
                ⏮ First
              </button>
              <button
                onClick={handlePreviousPage}
                disabled={!query.canPreviousPage || query.isPending}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!query.canNextPage || query.isPending}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next →
              </button>
              <button
                onClick={handleLastPage}
                disabled={!query.canNextPage || query.isPending}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
                title="Last page"
              >
                Last ⏭
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
