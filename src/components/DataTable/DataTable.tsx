import { useRef, useMemo, useCallback, ReactNode } from 'react'
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

export interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyMessage?: string
  pageIndex: number
  pageSize: number
  total: number
  onPageIndexChange: (index: number) => void
  onPageSizeChange: (size: number) => void
  onSortingChange: (sorting: SortingState) => void
  onFiltersChange?: (filters: ColumnFiltersState) => void
  sorting: SortingState
  columnFilters?: ColumnFiltersState
  enableSorting?: boolean
  enableFiltering?: boolean
  pageSizeOptions?: number[]
  estimateSize?: number
  overscan?: number
  rowClassName?: (row: T, index: number) => string
  renderFilters?: ReactNode
  emptyState?: ReactNode
  loadingState?: ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load data',
  emptyMessage = 'No data available',
  pageIndex,
  pageSize,
  total,
  onPageIndexChange,
  onPageSizeChange,
  onSortingChange,
  onFiltersChange,
  sorting,
  columnFilters = [],
  enableSorting = true,
  enableFiltering = false,
  pageSizeOptions = [10, 25, 50, 100],
  estimateSize = 50,
  overscan = 10,
  rowClassName,
  renderFilters,
  emptyState,
  loadingState,
}: DataTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange,
    onColumnFiltersChange: onFiltersChange,
    manualPagination: true,
    manualSorting: enableSorting,
    manualFiltering: enableFiltering,
    rowCount: total,
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

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize])
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < totalPages - 1

  const handlePreviousPage = useCallback(() => {
    if (canPreviousPage) {
      onPageIndexChange(pageIndex - 1)
    }
  }, [canPreviousPage, pageIndex, onPageIndexChange])

  const handleNextPage = useCallback(() => {
    if (canNextPage) {
      onPageIndexChange(pageIndex + 1)
    }
  }, [canNextPage, pageIndex, onPageIndexChange])

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      onPageSizeChange(newSize)
      onPageIndexChange(0)
    },
    [onPageSizeChange, onPageIndexChange]
  )

  const headerGroups = table.getHeaderGroups()

  if (isError) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8"
        role="alert"
      >
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Render custom filters if provided */}
      {enableFiltering && renderFilters && <div className="space-y-2">{renderFilters}</div>}

      {/* Page Size and Info Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm font-medium text-slate-700">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
            className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-slate-600">
          Showing {data.length === 0 ? 0 : pageIndex * pageSize + 1} to{' '}
          {Math.min((pageIndex + 1) * pageSize, total)} of {total}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
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
      {!isLoading && data.length === 0 && (
        emptyState || (
          <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
            <p className="text-slate-600">{emptyMessage}</p>
          </div>
        )
      )}

      {/* Virtualized Table */}
      {!isLoading && data.length > 0 && (
        <>
          <div
            ref={tableContainerRef}
            className="rounded-lg border border-slate-200 overflow-auto"
            style={{ height: '500px' }}
            role="region"
            aria-label="Data table with sorting, filtering, and pagination"
          >
            <table
              className="w-full border-collapse"
              role="grid"
              aria-rowcount={total}
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

                  return (
                    <tr
                      key={row.id}
                      data-index={virtualItem.index}
                      className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                        rowClassName ? rowClassName(row.original, virtualItem.index) : ''
                      }`}
                      style={{
                        height: `${virtualItem.size}px`,
                      }}
                      role="row"
                      aria-rowindex={pageIndex * pageSize + virtualItem.index + 2}
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {pageIndex + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={!canPreviousPage || isLoading}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!canNextPage || isLoading}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
