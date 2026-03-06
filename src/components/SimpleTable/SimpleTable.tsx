import React from 'react'
import { useTable, type ColumnConfig, type UseTableReturn } from '../../hooks/useTable'

export interface SimpleTableProps<T extends object> {
  data: T[]
  columns: ColumnConfig<T>[]
  isLoading?: boolean
  emptyMessage?: string
}

export interface SimpleTableWithHookProps<T extends object>
  extends SimpleTableProps<T> {
  useTableResult?: UseTableReturn<T>
}

/**
 * Simple styled table component with built-in sorting and filtering
 * Uses semantic HTML and Tailwind CSS for styling
 * Supports accessibility with ARIA labels and keyboard navigation
 */
export function SimpleTable<T extends object>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data found',
}: SimpleTableProps<T>) {
  const tableState = useTable({
    data,
    columns,
    isLoading,
  })

  return <SimpleTableContent state={tableState} emptyMessage={emptyMessage} />
}

interface SimpleTableContentProps<T extends object> {
  state: UseTableReturn<T>
  emptyMessage?: string
}

/**
 * Internal component that renders the table content
 * Separated to allow reuse with external useTable hook usage
 */
export function SimpleTableContent<T extends object>({
  state,
  emptyMessage = 'No data found',
}: SimpleTableContentProps<T>) {
  if (state.isLoading) {
    return (
      <div
        className="rounded-lg bg-white p-8 text-center text-gray-500"
        role="status"
        aria-live="polite"
      >
        Loading...
      </div>
    )
  }

  const { displayedData, columns, searchTerm, setSearchTerm, toggleSort, getSortIcon } = state

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Search filter */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search table"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full"
          role="table"
          aria-label="Data table with sortable columns"
        >
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr role="row">
              {columns.map((column) => {
                const isSortable = column.sortable !== false
                const sortIcon = getSortIcon(column.key)

                return (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 ${
                      isSortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => isSortable && toggleSort(column.key)}
                    role="columnheader"
                    aria-sort={
                      sortIcon === '↑'
                        ? 'ascending'
                        : sortIcon === '↓'
                          ? 'descending'
                          : 'none'
                    }
                    tabIndex={isSortable ? 0 : -1}
                    onKeyDown={(e) => {
                      if (
                        isSortable &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault()
                        toggleSort(column.key)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {sortIcon && (
                        <span
                          className="text-blue-600 font-bold"
                          aria-hidden="true"
                        >
                          {sortIcon}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedData.length > 0 ? (
              displayedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                  role="row"
                >
                  {columns.map((column) => {
                    const value = row[column.key]
                    const displayValue = column.render
                      ? column.render(value)
                      : value !== null && value !== undefined
                        ? String(value)
                        : '—'

                    return (
                      <td
                        key={String(column.key)}
                        className="px-6 py-4 text-sm text-gray-900"
                        role="cell"
                      >
                        {displayValue}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr role="row">
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                  role="cell"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Results info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-600">
        Showing {displayedData.length} of {state.columns} items
      </div>
    </div>
  )
}
