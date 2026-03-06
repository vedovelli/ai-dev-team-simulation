import { useMemo, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, ColumnDef } from '@tanstack/react-table'
import { useTableState } from '../hooks/useTableState'
import type { Task, TaskStatus, TaskPriority } from '../types/task'

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span className="ml-1">↑</span>
  if (isSorted === 'desc') return <span className="ml-1">↓</span>
  return <span className="ml-1 opacity-50">⇅</span>
}

function SortableColumnHeader<T extends Record<string, unknown>>({
  column,
  children,
}: {
  column: any
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="flex items-center gap-1 font-semibold hover:text-blue-600 cursor-pointer"
    >
      {children}
      <SortIcon isSorted={column.getIsSorted()} />
    </button>
  )
}

function generateMockTasks(count: number): Task[] {
  const statuses: TaskStatus[] = ['backlog', 'in-progress', 'in-review', 'done']
  const priorities: TaskPriority[] = ['low', 'medium', 'high']
  const teams = ['Backend', 'Frontend', 'DevOps', 'QA', 'Design']
  const assignees = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
  const sprints = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4']

  const tasks: Task[] = []

  for (let i = 0; i < count; i++) {
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90))

    tasks.push({
      id: `TASK-${String(i + 1).padStart(4, '0')}`,
      title: `Task ${i + 1}: Implement feature or fix bug`,
      assignee: assignees[Math.floor(Math.random() * assignees.length)],
      team: teams[Math.floor(Math.random() * teams.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      storyPoints: Math.floor(Math.random() * 13) + 1,
      sprint: sprints[Math.floor(Math.random() * sprints.length)],
      order: i,
      estimatedHours: Math.floor(Math.random() * 40) + 4,
      createdAt: createdDate.toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return tasks
}

const taskColumns: ColumnDef<Task>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>ID</SortableColumnHeader>
    ),
    cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
    size: 100,
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Title</SortableColumnHeader>
    ),
    cell: (info) => <span className="truncate">{info.getValue()}</span>,
    enableColumnFilter: true,
    filterFn: 'includesString',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Status</SortableColumnHeader>
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
        <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      )
    },
    size: 100,
  },
  {
    id: 'priority',
    accessorKey: 'priority',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Priority</SortableColumnHeader>
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
      return <span className={`font-semibold ${priorityColors[priority]}`}>{priorityLabels[priority]}</span>
    },
    size: 80,
  },
  {
    id: 'assignee',
    accessorKey: 'assignee',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Assignee</SortableColumnHeader>
    ),
    size: 100,
  },
  {
    id: 'team',
    accessorKey: 'team',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Team</SortableColumnHeader>
    ),
    size: 100,
  },
  {
    id: 'storyPoints',
    accessorKey: 'storyPoints',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Points</SortableColumnHeader>
    ),
    cell: (info) => <span className="text-center">{info.getValue()}</span>,
    size: 70,
  },
  {
    id: 'sprint',
    accessorKey: 'sprint',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Sprint</SortableColumnHeader>
    ),
    size: 100,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Created</SortableColumnHeader>
    ),
    cell: (info) => {
      const date = new Date(info.getValue() as string)
      return <span className="text-sm text-gray-600">{date.toLocaleDateString()}</span>
    },
    size: 100,
  },
]

function TableStateDemo() {
  const tableState = useTableState({
    pageSize: 20,
  })

  const tasks = useMemo(() => generateMockTasks(100), [])

  const table = useReactTable({
    data: tasks,
    columns: taskColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: tableState.sorting,
      columnFilters: tableState.columnFilters,
    },
    onSortingChange: tableState.setSorting,
    onColumnFiltersChange: tableState.setColumnFilters,
  })

  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows

  const pageStart = (tableState.page - 1) * tableState.pageSize
  const pageEnd = pageStart + tableState.pageSize
  const paginatedRows = rows.slice(pageStart, pageEnd)

  const handleFilterChange = useCallback(
    (columnId: string, value: string) => {
      const filters = tableState.state.filters || {}
      const newFilters = { ...filters, [columnId]: value }
      tableState.setColumnFilters(
        Object.entries(newFilters).map(([id, value]) => ({
          id,
          value,
        }))
      )
    },
    [tableState]
  )

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Table State URL Persistence Demo</h1>
        <p className="text-slate-600">
          Demonstrates the useTableState hook integrating table state (sorting, filtering, pagination) with TanStack Router URL parameters.
          Try sorting, filtering, or changing pages - then use the browser back/forward buttons to see state restoration.
        </p>
      </div>

      {/* URL State Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">URL State</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Sorting:</strong> {tableState.hasActiveSorting ? tableState.state.sort?.map((s) => `${s.column}:${s.direction}`).join(', ') : 'None'}
          </p>
          <p>
            <strong>Filters:</strong> {tableState.hasActiveFilters ? Object.entries(tableState.state.filters || {}).map(([k, v]) => `${k}=${v}`).join(', ') : 'None'}
          </p>
          <p>
            <strong>Page:</strong> {tableState.page} / {Math.ceil(rows.length / tableState.pageSize)}
          </p>
          <p>
            <strong>Page Size:</strong> {tableState.pageSize}
          </p>
        </div>
        {tableState.hasActiveState && (
          <button
            onClick={tableState.clearAllState}
            className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Clear All State
          </button>
        )}
      </div>

      {/* Column Filters */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={tableState.state.filters?.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={tableState.state.filters?.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
            <input
              type="text"
              value={tableState.state.filters?.assignee || ''}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              placeholder="Filter by name..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
            <input
              type="text"
              value={tableState.state.filters?.team || ''}
              onChange={(e) => handleFilterChange('team', e.target.value)}
              placeholder="Filter by team..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {tableState.hasActiveFilters && (
          <button
            onClick={tableState.clearFilters}
            className="mt-4 px-3 py-1 bg-slate-300 text-slate-700 rounded text-sm hover:bg-slate-400"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {paginatedRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-slate-50' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-slate-900" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          Showing {pageStart + 1} to {Math.min(pageEnd, rows.length)} of {rows.length} tasks
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => tableState.setPage(Math.max(1, tableState.page - 1))}
            disabled={tableState.page === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.ceil(rows.length / tableState.pageSize) }, (_, i) => i + 1)
              .slice(Math.max(0, tableState.page - 2), tableState.page + 1)
              .map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => tableState.setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg ${
                    pageNum === tableState.page ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
          </div>
          <button
            onClick={() => tableState.setPage(tableState.page + 1)}
            disabled={tableState.page >= Math.ceil(rows.length / tableState.pageSize)}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <select
            value={tableState.pageSize}
            onChange={(e) => tableState.setPageSize(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">URL Persistence</h3>
          <ul className="space-y-2 text-sm text-green-800 list-disc list-inside">
            <li>All state saved to URL query parameters</li>
            <li>Shareable URLs preserve complete table state</li>
            <li>Browser back/forward buttons restore state</li>
            <li>Direct URL navigation works perfectly</li>
          </ul>
        </div>

        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">Edge Cases Handled</h3>
          <ul className="space-y-2 text-sm text-purple-800 list-disc list-inside">
            <li>Invalid URL params validated before application</li>
            <li>Missing values use sensible defaults</li>
            <li>Page resets when page size changes</li>
            <li>Type-safe serialization/deserialization</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/table-state-demo')({
  component: TableStateDemo,
})
