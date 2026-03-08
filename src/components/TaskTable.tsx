import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  Header,
} from '@tanstack/react-table'
import type { Task, TaskStatus, TaskPriority } from '../types/task'

interface TaskTableProps {
  data: Task[]
  isLoading?: boolean
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Title
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => {
      const task = info.row.original
      return (
        <Link
          to="/tasks/$taskId"
          params={{ taskId: task.id }}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {info.getValue()}
        </Link>
      )
    },
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Status
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => {
      const status = info.getValue() as TaskStatus
      const statusLabels: Record<TaskStatus, string> = {
        backlog: 'Backlog',
        'in-progress': 'In Progress',
        'in-review': 'In Review',
        done: 'Done',
      }
      const statusColors: Record<TaskStatus, string> = {
        backlog: 'bg-gray-100 text-gray-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'in-review': 'bg-purple-100 text-purple-800',
        done: 'bg-green-100 text-green-800',
      }
      return (
        <span
          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      )
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Priority
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => {
      const priority = info.getValue() as TaskPriority
      const priorityLabels: Record<TaskPriority, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      }
      const priorityColors: Record<TaskPriority, string> = {
        low: 'text-green-600',
        medium: 'text-yellow-600',
        high: 'text-red-600',
      }
      return <span className={`font-medium ${priorityColors[priority]}`}>{priorityLabels[priority]}</span>
    },
  },
  {
    accessorKey: 'team',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Team
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'assignee',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Assignee
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'storyPoints',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Points
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => <span className="text-center">{info.getValue()}</span>,
  },
  {
    accessorKey: 'estimatedHours',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Est. Hours
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => {
      const hours = info.getValue() as number | undefined
      return <span className="text-center">{hours ? `${hours}h` : '—'}</span>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-semibold hover:text-blue-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Created
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => {
      const date = new Date(info.getValue() as string)
      return <span className="text-sm text-gray-600">{date.toLocaleDateString()}</span>
    },
  },
]

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span className="text-blue-600">↑</span>
  if (isSorted === 'desc') return <span className="text-blue-600">↓</span>
  return <span className="text-gray-300">⇅</span>
}

export function TaskTable({ data, isLoading = false }: TaskTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return <div className="rounded-lg bg-white p-8 text-center text-gray-500">Loading tasks...</div>
  }

  const rows = table.getRowModel().rows

  return (
    <div className="rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm text-gray-900"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
