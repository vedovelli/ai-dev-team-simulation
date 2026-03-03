import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from '@tanstack/react-table'
import type { Task } from '../types/task'

/**
 * Simple example demonstrating TanStack Table usage
 *
 * This example shows:
 * - Defining column definitions
 * - Creating a table instance
 * - Rendering a basic table
 * - Handling sorting
 *
 * @example
 * <TableExample data={tasks} />
 */
export function TableExample({ data }: { data: Task[] }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-semibold cursor-pointer hover:bg-gray-100 p-2"
        >
          Title
          {column.getIsSorted() === 'asc' ? ' 🔼' : column.getIsSorted() === 'desc' ? ' 🔽' : ''}
        </button>
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue() as string
        const colors: Record<string, string> = {
          backlog: 'bg-gray-100',
          'in-progress': 'bg-blue-100',
          done: 'bg-green-100',
        }
        return <span className={`px-2 py-1 rounded text-sm ${colors[status] || ''}`}>{status}</span>
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: (info) => info.getValue(),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Tasks Table</h2>

      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border p-2 text-left">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {table.getRowModel().rows.length === 0 && (
        <div className="text-center p-4 text-gray-500">No tasks found</div>
      )}
    </div>
  )
}

/**
 * Example with filtering
 *
 * Shows how to add column filters to the table
 */
export function TableExampleWithFilters({ data }: { data: Task[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: (info) => info.getValue(),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const statusColumn = table.getColumn('status')
  const priorityColumn = table.getColumn('priority')

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Tasks with Filters</h2>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div>
          <label className="mr-2 font-medium">Status:</label>
          <select
            value={(statusColumn?.getFilterValue() as string) || ''}
            onChange={(e) => statusColumn?.setFilterValue(e.target.value || undefined)}
            className="p-2 border rounded"
          >
            <option value="">All</option>
            <option value="backlog">Backlog</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label className="mr-2 font-medium">Priority:</label>
          <select
            value={(priorityColumn?.getFilterValue() as string) || ''}
            onChange={(e) => priorityColumn?.setFilterValue(e.target.value || undefined)}
            className="p-2 border rounded"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border p-2 text-left font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 border-b">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {data.length} tasks
      </div>
    </div>
  )
}
