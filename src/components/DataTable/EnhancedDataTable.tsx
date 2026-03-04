import { useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { useRowSelection } from '../../hooks/useRowSelection'

interface EnhancedDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  pageSize?: number
  onRowSelect?: (selectedRows: Set<string>) => void
  enableColumnFilters?: boolean
  enableColumnVisibility?: boolean
  enableRowSelection?: boolean
}

export function EnhancedDataTable<T extends { id?: string | number }>({
  data,
  columns,
  isLoading = false,
  pageSize = 10,
  onRowSelect,
  enableColumnFilters = true,
  enableColumnVisibility = true,
  enableRowSelection = true,
}: EnhancedDataTableProps<T>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const { selectedRows, isAllSelected, toggleRowSelection, toggleSelectAll } =
    useRowSelection({
      onSelectionChange: onRowSelect,
    })

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-gray-500">
        Loading...
      </div>
    )
  }

  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()
  const pageRows = rows.map((row) => row.original)

  const handleSelectAll = useCallback(() => {
    toggleSelectAll(pageRows.map((row) => String(row.id)))
  }, [pageRows, toggleSelectAll])

  return (
    <div className="space-y-4 rounded-lg bg-white shadow-sm">
      {/* Column Visibility Toggle */}
      {enableColumnVisibility && (
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => {
              const colId = typeof col.id === 'string' ? col.id : (col.accessorKey as string)
              if (!colId) return null
              return (
                <button
                  key={colId}
                  onClick={() => {
                    const newVisibility = { ...columnVisibility, [colId]: !columnVisibility[colId] }
                    setColumnVisibility(newVisibility)
                  }}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    columnVisibility[colId] !== false
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {colId}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Global Filter Input */}
      {enableColumnFilters && (
        <div className="border-b border-gray-200 px-6 py-4">
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {enableRowSelection && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                )}
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler?.()}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted && (
                          <span className="text-xs">
                            {isSorted === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length > 0 ? (
              rows.map((row) => {
                const rowId = String(row.original.id)
                const isSelected = selectedRows.has(rowId)
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {enableRowSelection && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowId)}
                          className="rounded"
                        />
                      </td>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-sm text-gray-900"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-600">
            Rows per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
