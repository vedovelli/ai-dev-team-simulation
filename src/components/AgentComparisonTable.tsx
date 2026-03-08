import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import type { AgentMetrics } from '../types/metrics'

interface AgentComparisonTableProps {
  data: AgentMetrics[]
  isLoading?: boolean
  onAgentSelect?: (agentId: string) => void
}

/**
 * Sortable and filterable table comparing multiple agents
 * Uses TanStack Table for managing state and sorting
 */
export function AgentComparisonTable({
  data,
  isLoading = false,
  onAgentSelect,
}: AgentComparisonTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [nameFilter, setNameFilter] = useState('')

  const columns: ColumnDef<AgentMetrics>[] = [
    {
      accessorKey: 'agentName',
      header: 'Agent',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.agentName}</p>
          <p className="text-xs text-slate-400">{row.original.agentRole}</p>
        </div>
      ),
    },
    {
      accessorKey: 'completedTasks',
      header: 'Completed',
      cell: ({ getValue }) => (
        <span className="text-green-400">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'totalTasks',
      header: 'Total',
      cell: ({ getValue }) => getValue<number>(),
    },
    {
      accessorKey: 'successRate',
      header: 'Success Rate',
      cell: ({ getValue }) => (
        <span className="font-semibold">{getValue<number>()}%</span>
      ),
    },
    {
      accessorKey: 'averageTimeToComplete',
      header: 'Avg Time (min)',
      cell: ({ getValue }) => getValue<number>(),
    },
    {
      accessorKey: 'errorRate',
      header: 'Error Rate',
      cell: ({ getValue }) => (
        <span className="text-red-400">{getValue<number>()}%</span>
      ),
    },
    {
      accessorKey: 'inProgressTasks',
      header: 'In Progress',
      cell: ({ getValue }) => (
        <span className="text-blue-400">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'performanceTier',
      header: 'Tier',
      cell: ({ getValue }) => {
        const tier = getValue<string>()
        const tierColors = {
          excellent: 'bg-green-600',
          good: 'bg-blue-600',
          average: 'bg-yellow-600',
          'below-average': 'bg-red-600',
        }
        return (
          <span
            className={`${tierColors[tier as keyof typeof tierColors]} px-2 py-1 rounded text-xs font-medium text-white`}
          >
            {tier}
          </span>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  })

  // Update filter when name changes
  useState(() => {
    table.getColumn('agentName')?.setFilterValue(nameFilter)
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800 rounded border border-slate-700">
        <p className="text-slate-400">Loading agents...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-800 rounded border border-slate-700">
        <p className="text-slate-400">No agent data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          placeholder="Filter by agent name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-3 text-left font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span className="text-xs text-slate-400">
                        {header.column.getIsSorted()
                          ? header.column.getIsSorted() === 'desc'
                            ? '↓'
                            : '↑'
                          : '⇅'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onAgentSelect?.(row.original.agentId)}
                className="border-b border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-slate-400">
        Showing {table.getRowModel().rows.length} of {data.length} agents
      </div>
    </div>
  )
}
