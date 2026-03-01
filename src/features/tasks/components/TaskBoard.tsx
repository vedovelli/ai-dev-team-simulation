import { useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { useTasks } from '../../../hooks/useTasks'
import { useTaskTable } from '../../../hooks/useTaskTable'
import type { Task } from '../../../types/task'

export function TaskBoard() {
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const { data: tasks = [], isLoading, error } = useTasks()

  const { table } = useTaskTable({
    data: tasks,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end ?? 0)
      : 0

  if (isLoading) {
    return <div className="p-8">Loading tasks...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Error loading tasks: {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Task Board</h1>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="border-b bg-gray-100">
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  {header.isPlaceholder
                    ? null
                    : header.column.columnDef.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            ref={setParentRef}
            className="h-[600px] overflow-y-auto relative"
          >
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index]!
              return (
                <tr
                  key={row.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm text-gray-700"
                    >
                      {cell.renderValue()}
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

      <div className="mt-4 text-sm text-gray-600">
        Displaying {rows.length} tasks
      </div>
    </div>
  )
}
