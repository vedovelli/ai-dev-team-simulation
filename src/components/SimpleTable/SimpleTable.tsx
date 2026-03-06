import { useTable } from '../../hooks/useTable'
import { SearchInput } from '../SearchInput'

export interface SimpleTableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

interface SimpleTableProps<T extends Record<string, any>> {
  data: T[]
  columns: SimpleTableColumn<T>[]
  isLoading?: boolean
  emptyMessage?: string
  onFilterChange?: (value: string) => void
}

/**
 * A simple, reusable table component that uses the useTable hook.
 * Supports client-side sorting and filtering with a clean, accessible UI.
 *
 * @template T - The type of data in the table
 *
 * @example
 * ```tsx
 * const columns: SimpleTableColumn<User>[] = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'email', label: 'Email' },
 *   { key: 'status', label: 'Status', render: (status) => <Badge>{status}</Badge> },
 * ]
 *
 * <SimpleTable data={users} columns={columns} />
 * ```
 */
export function SimpleTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data found',
  onFilterChange,
}: SimpleTableProps<T>) {
  const { sortedAndFilteredData, sortKey, sortOrder, filterValue, handleSort, handleFilter } =
    useTable({
      data,
    })

  const handleFilterChange = (value: string) => {
    handleFilter(value)
    onFilterChange?.(value)
  }

  return (
    <div className="space-y-4">
      {/* Filter Input */}
      <SearchInput
        placeholder="Search table..."
        value={filterValue}
        onChange={handleFilterChange}
      />

      {/* Table Container */}
      {isLoading ? (
        <div className="rounded-lg bg-slate-800 p-8 text-center text-slate-400">
          Loading...
        </div>
      ) : (
        <div className="rounded-lg bg-slate-800 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className="px-6 py-3 text-left text-sm font-semibold text-slate-200"
                    >
                      {column.sortable ? (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center gap-2 hover:text-slate-100 transition-colors"
                        >
                          {column.label}
                          {sortKey === column.key && (
                            <span className="text-xs text-blue-400">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedAndFilteredData.length > 0 ? (
                  sortedAndFilteredData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className="px-6 py-4 text-sm text-slate-300"
                        >
                          {column.render
                            ? column.render(item[column.key], item)
                            : String(item[column.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
