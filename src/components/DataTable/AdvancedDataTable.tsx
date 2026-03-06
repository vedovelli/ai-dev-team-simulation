import { useMemo, useRef, useCallback, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Employee } from '../../types/employee'
import { useTableConfig } from './hooks/useTableConfig'

export interface AdvancedDataTableProps {
  data: Employee[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onSortingChange?: (sorting: SortingState) => void
  onFiltersChange?: (filters: ColumnFiltersState) => void
}

export function AdvancedDataTable({
  data,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load employees',
  onSortingChange,
  onFiltersChange,
}: AdvancedDataTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  const tableConfig = useTableConfig({
    enableColumnVisibility: true,
    enableRowSelection: true,
    enableColumnPinning: true,
  })

  const table = useReactTable({
    data,
    columns: tableConfig.columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: tableConfig.sorting,
      columnFilters: tableConfig.columnFilters,
      columnVisibility: tableConfig.columnVisibility,
      rowSelection: tableConfig.rowSelection,
      globalFilter,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function'
          ? updater(tableConfig.sorting)
          : updater
      tableConfig.setSorting(newSorting)
      onSortingChange?.(newSorting)
    },
    onColumnFiltersChange: tableConfig.setColumnFilters,
    onColumnVisibilityChange: tableConfig.setColumnVisibility,
    onRowSelectionChange: tableConfig.setRowSelection,
    globalFilterFn: 'auto',
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems?.[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems?.[virtualItems.length - 1]?.end ?? 0)
      : 0

  const selectedRows = Object.keys(tableConfig.rowSelection).length
  const headerGroups = table.getHeaderGroups()

  const toggleAllColumnVisibility = useCallback((show: boolean) => {
    if (show) {
      tableConfig.resetColumnVisibility()
    } else {
      const hidden: Record<string, boolean> = {}
      headerGroups.forEach((group) => {
        group.headers.forEach((header) => {
          if (header.id !== 'select') {
            hidden[header.id] = false
          }
        })
      })
      tableConfig.setColumnVisibility(hidden)
    }
  }, [headerGroups, tableConfig])

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
      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Search and Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <input
            placeholder="Search employees..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Column Visibility Controls */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm font-medium text-slate-700">
            Visible Columns:
          </span>
          <button
            onClick={() => toggleAllColumnVisibility(true)}
            className="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => toggleAllColumnVisibility(false)}
            className="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hide All
          </button>
          <div className="flex gap-2 ml-2 flex-wrap">
            {headerGroups[0]?.headers
              .filter((header) => header.id !== 'select')
              .map((header) => (
                <label
                  key={header.id}
                  className="flex items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={
                      tableConfig.columnVisibility[header.id] !== false
                    }
                    onChange={() =>
                      tableConfig.toggleColumnVisibility(header.id)
                    }
                    className="rounded border-gray-300"
                  />
                  <span>{header.id}</span>
                </label>
              ))}
          </div>
        </div>

        {/* Selection Info */}
        {selectedRows > 0 && (
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {selectedRows} row{selectedRows !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">Loading employees...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-8">
          <p className="text-slate-600">No employees found</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && data.length > 0 && (
        <div
          ref={tableContainerRef}
          className="rounded-lg border border-slate-200 overflow-auto"
          style={{ height: '600px' }}
          role="region"
          aria-label="Advanced employee data table with sorting, filtering, and selection"
        >
          <table
            className="w-full border-collapse"
            role="grid"
            aria-rowcount={data.length}
            aria-colcount={tableConfig.columns.length}
          >
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300 whitespace-nowrap"
                      role="columnheader"
                      aria-sort={
                        header.column.getIsSorted()
                          ? header.column.getIsSorted() === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      style={{
                        width: header.getSize(),
                      }}
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
                      row.getIsSelected() ? 'bg-blue-100' : ''
                    }`}
                    style={{
                      height: `${virtualItem.size}px`,
                    }}
                    role="row"
                    aria-rowindex={virtualItem.index + 2}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-slate-900"
                        role="gridcell"
                        style={{
                          width: cell.column.getSize(),
                        }}
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
      )}

      {/* Footer Info */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Total: <strong>{data.length}</strong> employees
          </div>
          {selectedRows > 0 && (
            <div>
              Selected: <strong>{selectedRows}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
