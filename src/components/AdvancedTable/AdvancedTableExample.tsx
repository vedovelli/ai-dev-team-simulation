import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { AdvancedTable, useAdvancedTable } from '.'
import type { Task } from '../../types/task'

/**
 * Example implementation of AdvancedTable with MSW mocked data
 * Uses /api/virtualized-tasks endpoint with server-side pagination and sorting
 *
 * Demonstrates the useAdvancedTable hook which combines:
 * - State management (pagination, sorting)
 * - Data fetching with React Query
 * - Filtering support
 */
export function AdvancedTableExample() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')

  const table = useAdvancedTable<Task>('/api/virtualized-tasks', {
    initialPageSize: 25,
    filters: {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    },
  })

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
        header: 'ID',
        size: 80,
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        enableSorting: true,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: (info) => {
          const status = info.getValue<string>()
          const classes = {
            'backlog': 'bg-slate-100 text-slate-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            'in-review': 'bg-purple-100 text-purple-800',
            'done': 'bg-green-100 text-green-800',
          }[status] || 'bg-slate-100 text-slate-800'

          return (
            <span className={`px-2 py-1 rounded text-sm font-medium ${classes}`}>
              {status}
            </span>
          )
        },
      },
      {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Priority',
        enableSorting: true,
        cell: (info) => {
          const priority = info.getValue<string>()
          const classes = {
            'low': 'text-slate-600',
            'medium': 'text-amber-600 font-medium',
            'high': 'text-red-600 font-bold',
          }[priority] || 'text-slate-600'

          return <span className={classes}>{priority}</span>
        },
      },
      {
        id: 'assignee',
        accessorKey: 'assignee',
        header: 'Assignee',
      },
      {
        id: 'team',
        accessorKey: 'team',
        header: 'Team',
      },
      {
        id: 'storyPoints',
        accessorKey: 'storyPoints',
        header: 'Points',
        enableSorting: true,
        size: 60,
      },
      {
        id: 'estimatedHours',
        accessorKey: 'estimatedHours',
        header: 'Est. Hours',
        enableSorting: true,
        size: 80,
        cell: (info) => {
          const hours = info.getValue<number>()
          return hours ? `${hours}h` : '—'
        },
      },
    ],
    []
  )

  const handleResetFilters = () => {
    setStatusFilter('')
    setPriorityFilter('')
    table.resetState()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Advanced Table Example</h1>
        <p className="text-slate-600">
          Server-side pagination, sorting, and filtering with virtual scrolling for 1000+ rows
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          {(statusFilter || priorityFilter) && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                table.setPageIndex(0)
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={table.isLoading}
            >
              <option value="">All Statuses</option>
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-slate-700 mb-1">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                table.setPageIndex(0)
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={table.isLoading}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {(statusFilter || priorityFilter) && (
          <div className="flex gap-2">
            {statusFilter && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('')}
                  className="hover:text-blue-900 font-bold"
                  aria-label="Remove status filter"
                >
                  ×
                </button>
              </div>
            )}
            {priorityFilter && (
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Priority: {priorityFilter}
                <button
                  onClick={() => setPriorityFilter('')}
                  className="hover:text-blue-900 font-bold"
                  aria-label="Remove priority filter"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {table.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <span className="font-semibold">Error loading data:</span> {table.error?.message || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Table */}
      <AdvancedTable<Task>
        columns={columns}
        data={table.data.data}
        pageIndex={table.pageIndex}
        pageSize={table.pageSize}
        total={table.data.total}
        sorting={table.sorting}
        onPageIndexChange={table.setPageIndex}
        onPageSizeChange={table.setPageSize}
        onSortingChange={table.setSorting}
        isLoading={table.isLoading}
        isError={table.isError}
        emptyMessage={
          statusFilter || priorityFilter
            ? 'No tasks match the selected filters'
            : 'No tasks available'
        }
        estimateSize={50}
        pageSizeOptions={[10, 25, 50, 100]}
        rowClassName={(row) => {
          if (row.priority === 'high') return 'bg-red-50'
          if (row.status === 'done') return 'bg-green-50'
          return ''
        }}
      />

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Total tasks:</span> {table.data.total} •{' '}
          <span className="font-semibold">Loaded:</span> {table.data.data.length} •{' '}
          <span className="font-semibold">Page size:</span> {table.pageSize}
        </p>
      </div>
    </div>
  )
}
