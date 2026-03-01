import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { AgentHistoryEntry, TaskHistoryStatus } from '../types/agent'

interface AgentHistoryTableProps {
  data: AgentHistoryEntry[]
}

const columnHelper = createColumnHelper<AgentHistoryEntry>()

function getStatusColor(status: TaskHistoryStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-800 border border-green-200'
    case 'failed':
      return 'bg-red-50 text-red-800 border border-red-200'
    case 'cancelled':
      return 'bg-slate-50 text-slate-800 border border-slate-200'
    default:
      return 'bg-slate-50 text-slate-800 border border-slate-200'
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function AgentHistoryTable({ data }: AgentHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ])

  const columns = [
    columnHelper.accessor('timestamp', {
      header: 'Timestamp',
      cell: (info) => {
        const date = new Date(info.getValue())
        return (
          <div>
            <p className="text-sm font-medium text-slate-900">
              {date.toLocaleDateString()}
            </p>
            <p className="text-xs text-slate-500">
              {date.toLocaleTimeString()}
            </p>
          </div>
        )
      },
      size: 150,
    }),
    columnHelper.accessor('task', {
      header: 'Task',
      cell: (info) => (
        <p className="text-sm text-slate-700 line-clamp-2">
          {info.getValue()}
        </p>
      ),
      size: 250,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue()
        return (
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
      size: 100,
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      cell: (info) => (
        <p className="text-sm text-slate-700">{formatDuration(info.getValue())}</p>
      ),
      size: 100,
    }),
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
    <div className="overflow-x-auto -mx-6 sm:mx-0">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide"
                  style={{ width: header.getSize() }}
                >
                  <button
                    onClick={header.column.getToggleSortingHandler()}
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() && (
                      <span className="text-xs">
                        {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 sm:px-6 py-4"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
