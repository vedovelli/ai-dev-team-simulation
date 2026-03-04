import { useRef, useMemo, useState, useCallback, KeyboardEvent } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedDataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyMessage?: string
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  keyboardNavigation?: boolean
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  enableSorting?: boolean
  enableFiltering?: boolean
  estimateSize?: number
  overscan?: number
  rowClassName?: (row: T, index: number) => string
}

export function VirtualizedDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load data',
  emptyMessage = 'No data available',
  globalFilter = '',
  onGlobalFilterChange,
  keyboardNavigation = true,
  columnVisibility: initialColumnVisibility,
  onColumnVisibilityChange,
  enableSorting = true,
  enableFiltering = true,
  estimateSize = 50,
  overscan = 10,
  rowClassName,
}: VirtualizedDataTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    initialColumnVisibility || {}
  )
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    state: {
      columnVisibility,
      globalFilter,
    },
    enableColumnFiltering: enableFiltering,
    globalFilterFn: 'includesString',
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

  const handleColumnVisibilityToggle = useCallback(
    (columnId: string) => {
      const newVisibility = {
        ...columnVisibility,
        [columnId]: !columnVisibility[columnId],
      }
      setColumnVisibility(newVisibility)
      onColumnVisibilityChange?.(newVisibility)
    },
    [columnVisibility, onColumnVisibilityChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableElement>) => {
      if (!keyboardNavigation) return

      const maxIndex = rows.length - 1

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedRowIndex((prev) =>
            prev === null ? 0 : Math.min(prev + 1, maxIndex)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedRowIndex((prev) =>
            prev === null ? maxIndex : Math.max(prev - 1, 0)
          )
          break
        case 'Home':
          e.preventDefault()
          setSelectedRowIndex(0)
          break
        case 'End':
          e.preventDefault()
          setSelectedRowIndex(maxIndex)
          break
      }
    },
    [rows.length, keyboardNavigation]
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600">Loading data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
        <p className="text-slate-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Column Visibility Toggle */}
      {columns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => {
            const colId = typeof col.id === 'string' ? col.id : col.accessorKey as string
            if (!colId) return null
            return (
              <button
                key={colId}
                onClick={() => handleColumnVisibilityToggle(colId)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  columnVisibility[colId] !== false
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
                aria-pressed={columnVisibility[colId] !== false}
                title={`Toggle ${colId} column visibility`}
              >
                {colId}
              </button>
            )
          })}
        </div>
      )}

      {/* Global Filter Input */}
      {enableFiltering && (
        <input
          type="text"
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange?.(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter table data"
        />
      )}

      {/* Virtualized Table */}
      <div
        ref={tableContainerRef}
        className="rounded-lg border border-slate-200 overflow-auto"
        style={{ height: '500px' }}
        role="region"
        aria-label="Data table with virtual scrolling"
      >
        <table
          className="w-full border-collapse"
          onKeyDown={handleKeyDown}
          role="grid"
          aria-rowcount={rows.length}
        >
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300">
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const colId = typeof header.column.columnDef.id === 'string'
                    ? header.column.columnDef.id
                    : header.column.columnDef.accessorKey as string

                  if (columnVisibility[colId] === false) return null

                  return (
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
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  )
                })}
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
                <tr
                  key={row.id}
                  data-index={virtualItem.index}
                  className={`border-b border-slate-200 hover:bg-blue-50 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    isSelected ? 'bg-blue-100' : ''
                  } ${rowClassName ? rowClassName(row.original, virtualItem.index) : ''}`}
                  style={{
                    height: `${virtualItem.size}px`,
                  }}
                  onClick={() => setSelectedRowIndex(virtualItem.index)}
                  role="row"
                  aria-rowindex={virtualItem.index + 2}
                  tabIndex={isSelected ? 0 : -1}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colId = typeof cell.column.columnDef.id === 'string'
                      ? cell.column.columnDef.id
                      : cell.column.columnDef.accessorKey as string

                    if (columnVisibility[colId] === false) return null

                    return (
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
                    )
                  })}
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

      {/* Row Count Info */}
      <div className="text-sm text-slate-600">
        Displaying {rows.length} {rows.length === 1 ? 'row' : 'rows'}
      </div>
    </div>
  )
}
