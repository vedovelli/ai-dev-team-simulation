import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { Agent } from '../types/agent'
import { AgentStatusIndicator } from './AgentStatusIndicator'

const columnHelper = createColumnHelper<Agent>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: (info) => {
      const role = info.getValue()
      return role.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <AgentStatusIndicator status={info.getValue()} />,
  }),
  columnHelper.accessor('currentTask', {
    header: 'Current Task',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('lastUpdated', {
    header: 'Last Updated',
    cell: (info) => {
      const timestamp = info.getValue()
      return new Date(timestamp).toLocaleTimeString()
    },
  }),
]

async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch('/api/agents')
  if (!response.ok) {
    throw new Error('Failed to fetch agents')
  }
  return response.json()
}

export function AgentDashboard() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Set up TanStack Query with polling - refetch every 2 seconds
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  })

  const table = useReactTable({
    data: agents,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center p-8 text-white">Loading agents...</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400">
        Error loading agents: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, role, or task..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-lg">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-800 border-b border-slate-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold text-white cursor-pointer hover:bg-slate-700"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
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
              <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-800">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-slate-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getRowModel().rows.length === 0 && (
        <div className="flex items-center justify-center p-8 text-slate-400">
          No agents found matching your search.
        </div>
      )}
    </div>
  )
}
