/**
 * TaskSearchPage Component
 *
 * Implements global task search with advanced filtering, sorting, and pagination.
 * Demonstrates TanStack Query dependent queries, debounced search, and URL state management.
 */

import { useMemo } from 'react'
import { useTaskSearch } from '../hooks/useTaskSearch'
import { useTaskSearchFilters } from '../hooks/useTaskSearchFilters'
import { SimpleTable, type SimpleTableColumn } from './SimpleTable/SimpleTable'
import { SearchInput } from './SearchInput'
import type { Task } from '../types/task'

export function TaskSearchPage() {
  const filters = useTaskSearchFilters()

  // Fetch search results based on current filters
  const { tasks, totalCount, pageCount, isLoading, isError, isFetching, error } = useTaskSearch({
    params: {
      q: filters.q,
      status: filters.status.length > 0 ? (filters.status as any) : undefined,
      assigneeId: filters.assigneeId,
      priority: (filters.priority as any) || undefined,
      sprintId: filters.sprintId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: (filters.sortBy as keyof Task) || 'createdAt',
      sortDir: filters.sortDir || 'desc',
      page: filters.page,
      limit: filters.limit,
    },
  })

  // Define table columns
  const columns: SimpleTableColumn<Task>[] = useMemo(
    () => [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'title', label: 'Title', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'priority', label: 'Priority', sortable: true },
      { key: 'assignee', label: 'Assignee', sortable: true },
      { key: 'sprint', label: 'Sprint', sortable: true },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        render: (date: string) => new Date(date).toLocaleDateString(),
      },
    ],
    []
  )

  // Handle error state
  if (isError) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-500 p-6 text-red-400">
        <h3 className="font-semibold mb-2">Search Error</h3>
        <p className="text-sm">{error?.message || 'Failed to fetch search results'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Task Search</h1>
        <p className="text-slate-400">Find and filter tasks across all sprints and teams</p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Search Input */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-slate-200 mb-2">Search Tasks</label>
          <SearchInput
            placeholder="Search by title or ID (min 2 chars)..."
            value={filters.q}
            onChange={filters.setQuery}
          />
          <p className="text-xs text-slate-500 mt-1">
            Type at least 2 characters to search or use filters below
          </p>
        </div>

        {/* Limit Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Results per page</label>
          <select
            value={filters.limit}
            onChange={(e) => filters.setLimit(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm hover:border-slate-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Filter Sidebar */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          {filters.hasActiveFilters && (
            <button
              onClick={filters.reset}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Reset All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <div className="space-y-2">
              {(['backlog', 'in-progress', 'in-review', 'done'] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        filters.setStatus([...filters.status, status])
                      } else {
                        filters.setStatus(filters.status.filter((s) => s !== status))
                      }
                    }}
                    className="rounded border-slate-600 text-blue-600"
                  />
                  <span className="text-sm text-slate-300 capitalize">{status.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => filters.setPriority(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm hover:border-slate-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Sprint Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sprint</label>
            <select
              value={filters.sprintId || ''}
              onChange={(e) => filters.setSprintId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm hover:border-slate-500"
            >
              <option value="">All Sprints</option>
              <option value="sprint-1">Sprint 1</option>
              <option value="sprint-2">Sprint 2</option>
              <option value="sprint-3">Sprint 3</option>
              <option value="sprint-4">Sprint 4</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assignee</label>
            <select
              value={filters.assigneeId || ''}
              onChange={(e) => filters.setAssigneeId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm hover:border-slate-500"
            >
              <option value="">All Assignees</option>
              <option value="John Doe">John Doe</option>
              <option value="Jane Smith">Jane Smith</option>
              <option value="Bob Johnson">Bob Johnson</option>
              <option value="Alice Williams">Alice Williams</option>
              <option value="Charlie Brown">Charlie Brown</option>
              <option value="Diana Prince">Diana Prince</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => filters.setDateRange(e.target.value || null, filters.dateTo || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm hover:border-slate-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => filters.setDateRange(filters.dateFrom || null, e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm hover:border-slate-500"
            />
          </div>
        </div>

        {/* Active Filter Tags */}
        {filters.hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex flex-wrap gap-2">
              {filters.q && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700 text-blue-300 text-sm">
                  Query: {filters.q}
                  <button
                    onClick={() => filters.setQuery('')}
                    className="hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status.map((s) => (
                <span key={s} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700 text-purple-300 text-sm">
                  {s}
                  <button
                    onClick={() => filters.setStatus(filters.status.filter((x) => x !== s))}
                    className="hover:text-purple-100"
                  >
                    ×
                  </button>
                </span>
              ))}
              {filters.priority && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-900/30 border border-pink-700 text-pink-300 text-sm">
                  {filters.priority}
                  <button
                    onClick={() => filters.setPriority(null)}
                    className="hover:text-pink-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.sprintId && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-700 text-green-300 text-sm">
                  {filters.sprintId}
                  <button
                    onClick={() => filters.setSprintId(null)}
                    className="hover:text-green-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.assigneeId && (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm">
                  {filters.assigneeId}
                  <button
                    onClick={() => filters.setAssigneeId(null)}
                    className="hover:text-yellow-100"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-slate-400">
        {isFetching && <span className="text-blue-400">Searching...</span>}
        {!isFetching && filters.hasActiveFilters && (
          <span>
            Found <span className="text-white font-semibold">{totalCount}</span> result
            {totalCount !== 1 ? 's' : ''}
            {pageCount > 1 && ` • Page ${filters.page} of ${pageCount}`}
          </span>
        )}
        {!isFetching && !filters.hasActiveFilters && (
          <span className="text-slate-500">Enter search term or select filters to see results</span>
        )}
      </div>

      {/* Results Table */}
      {filters.hasActiveFilters && (
        <SimpleTable
          data={tasks}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No tasks found matching your filters"
        />
      )}

      {/* Pagination Controls */}
      {filters.hasActiveFilters && totalCount > 0 && (
        <div className="flex items-center justify-between bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="text-sm text-slate-400">
            Showing {(filters.page - 1) * filters.limit + 1} to{' '}
            {Math.min(filters.page * filters.limit, totalCount)} of {totalCount} results
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => filters.setPage(filters.page - 1)}
              disabled={filters.page <= 1}
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
            >
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => filters.setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      filters.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 border border-slate-600 text-white hover:bg-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {pageCount > 5 && <span className="px-3 py-2 text-slate-400">...</span>}
            </div>

            <button
              onClick={() => filters.setPage(filters.page + 1)}
              disabled={filters.page >= pageCount}
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
