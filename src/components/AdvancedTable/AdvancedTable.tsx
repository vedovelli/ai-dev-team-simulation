import { useRef, useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TableRow } from './TableRow'
import { TableCell } from './TableCell'
import { PaginationControls } from './PaginationControls'
import { TableSkeleton } from './TableSkeleton'
import { TableEmptyState } from './TableEmptyState'
import { TableErrorState } from './TableErrorState'

interface AdvancedTableProps<T extends Record<string, unknown>> {
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
  sorting: SortingState
  enableSorting?: boolean
  pageSizeOptions?: number[]
  estimateSize?: number
  overscan?: number
  rowClassName?: (row: T, index: number) => string
  onRetryError?: () => void
  containerHeight?: string
  variant?: 'simple' | 'extended'
}

export function AdvancedTable<T extends Record<string, unknown>>({
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
  sorting,
  enableSorting = true,
  pageSizeOptions = [10, 25, 50, 100],
  estimateSize = 50,
  overscan = 10,
  rowClassName,
  onRetryError,
  containerHeight = '500px',
  variant = 'extended',
}: AdvancedTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    state: {
      sorting,
    },
    onSortingChange,
    manualPagination: true,
    manualSorting: enableSorting,
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
      <TableErrorState
        message={errorMessage}
        onRetry={onRetryError}
      />
    )
  }

  if (isLoading) {
    return <TableSkeleton columnCount={columns.length} height={containerHeight} />
  }

  if (data.length === 0) {
    return <TableEmptyState message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {/* Pagination Controls - Top */}
      {variant === 'extended' && (
        <PaginationControls
          currentPage={pageIndex}
          totalPages={totalPages}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onPageSizeChange={handlePageSizeChange}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          totalRecords={total}
          isLoading={isLoading}
          variant="extended"
        />
      )}

      {/* Virtualized Table */}
      <div
        ref={tableContainerRef}
        className="rounded-lg border border-slate-200 overflow-auto"
        style={{ height: containerHeight }}
        role="region"
        aria-label="Advanced data table with server-side pagination and sorting"
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
                  <TableCell
                    key={header.id}
                    isHeader
                    isSortable={header.column.getCanSort()}
                    sortDirection={
                      header.column.getCanSort()
                        ? header.column.getIsSorted() === 'asc'
                          ? 'asc'
                          : header.column.getIsSorted() === 'desc'
                            ? 'desc'
                            : null
                        : null
                    }
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableCell>
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
              const isSelected = selectedRowIndex === virtualItem.index

              return (
                <TableRow
                  key={row.id}
                  isSelected={isSelected}
                  onSelect={() => setSelectedRowIndex(virtualItem.index)}
                  rowIndex={virtualItem.index}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  className={rowClassName ? rowClassName(row.original, virtualItem.index) : ''}
                  style={{ height: `${virtualItem.size}px` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
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

      {/* Pagination Controls - Bottom */}
      <PaginationControls
        currentPage={pageIndex}
        totalPages={totalPages}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        totalRecords={total}
        isLoading={isLoading}
        variant={variant}
      />
    </div>
  )
}
