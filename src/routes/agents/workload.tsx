/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

interface AgentWorkload {
  agentId: string
  name: string
  role: string
  status: string
  activeTasksCount: number
  totalEstimatedHours: number
  sprintCapacity: number
  utilizationPercent: number
}

export const Route = createFileRoute('/agents/workload')({
  component: AgentWorkloadDashboard,
})

const columnHelper = createColumnHelper<AgentWorkload>()

const columns = [
  columnHelper.accessor('name', {
    cell: (info) => info.getValue(),
    header: 'Agent',
  }),
  columnHelper.accessor('role', {
    cell: (info) => info.getValue(),
    header: 'Role',
  }),
  columnHelper.accessor('status', {
    cell: (info) => (
      <span className={`px-2 py-1 rounded text-sm font-medium ${info.getValue() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
        {info.getValue()}
      </span>
    ),
    header: 'Status',
  }),
  columnHelper.accessor('activeTasksCount', {
    cell: (info) => info.getValue(),
    header: 'Active Tasks',
  }),
  columnHelper.accessor('totalEstimatedHours', {
    cell: (info) => `${info.getValue()}h`,
    header: 'Total Hours',
  }),
  columnHelper.accessor('sprintCapacity', {
    cell: (info) => `${info.getValue()}h`,
    header: 'Capacity',
  }),
  columnHelper.accessor('utilizationPercent', {
    cell: (info) => {
      const percent = info.getValue()
      const color =
        percent > 100 ? 'text-red-600' : percent > 80 ? 'text-yellow-600' : 'text-green-600'
      return <span className={`font-semibold ${color}`}>{percent}%</span>
    },
    header: 'Utilization',
  }),
]

function AgentWorkloadDashboard() {
  const [sorting, setSorting] = useState<SortingState>([])

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['agents-workload'],
    queryFn: async () => {
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error('Failed to fetch agents workload')
      }
      return response.json() as Promise<AgentWorkload[]>
    },
  })

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Workload Dashboard</h1>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Workload Dashboard</h1>
        <div className="text-red-400">Error loading workload data</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Agent Workload Dashboard</h1>

      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-700 border-b border-slate-600">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-slate-600"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === 'desc' ? '▼' : '▲'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-slate-400">
        Showing {data.length} agents
      </div>
    </main>
  )
}
