import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { Task } from '../../types/task'

interface TaskHistoryTableProps {
  tasks: Task[]
  isLoading?: boolean
}

const columnHelper = createColumnHelper<Task>()

export function TaskHistoryTable({ tasks, isLoading }: TaskHistoryTableProps) {
  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue()
        const statusColor = {
          'backlog': 'bg-slate-700 text-slate-200',
          'in-progress': 'bg-blue-900 text-blue-200',
          'in-review': 'bg-purple-900 text-purple-200',
          'done': 'bg-green-900 text-green-200',
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[status as keyof typeof statusColor]}`}>
            {status.replace(/-/g, ' ')}
          </span>
        )
      },
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => {
        const priority = info.getValue()
        const priorityColor = {
          'low': 'text-slate-400',
          'medium': 'text-yellow-400',
          'high': 'text-red-400',
        }
        return <span className={priorityColor[priority as keyof typeof priorityColor]}>{priority}</span>
      },
    }),
    columnHelper.accessor('storyPoints', {
      header: 'Points',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('sprint', {
      header: 'Sprint',
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => {
        const date = new Date(info.getValue())
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
        })
      },
    }),
  ]

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading task history...</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-700 border-b border-slate-600">
            {table.getHeaderGroups().map((headerGroup) => (
              headerGroup.headers.map((header) => (
                <th key={header.id} className="px-6 py-3 text-left text-sm font-semibold text-slate-200">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 text-sm text-slate-200">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {tasks.length === 0 && (
        <div className="px-6 py-8 text-center text-slate-400">
          <p>No tasks found</p>
        </div>
      )}
    </div>
  )
}
