import { useMemo } from 'react'
import type { Task, TaskStatus, TaskPriority } from '../../types/task'
import { useTableState } from '../../hooks/useTableState'
import { SearchBar } from './SearchBar'
import { FilterControls, type FilterOption } from './FilterControls'
import { Pagination } from './Pagination'

const STATUS_COLORS: Record<TaskStatus, string> = {
  'backlog': 'bg-slate-500/20 text-slate-300',
  'in-progress': 'bg-blue-500/20 text-blue-300',
  'in-review': 'bg-yellow-500/20 text-yellow-300',
  'done': 'bg-green-500/20 text-green-300',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'low': 'text-slate-400',
  'medium': 'text-yellow-400',
  'high': 'text-red-400',
}

export interface TasksTableProps {
  tasks: Task[]
  isLoading?: boolean
}

/**
 * Refactored TasksTable with URL-driven state via useTableState.
 * Features:
 * - Search across task titles
 * - Filter by status and priority
 * - Sort by created_at, priority, deadline
 * - Pagination with configurable page size
 * - Full browser back/forward support
 */
export function TasksTable({ tasks, isLoading = false }: TasksTableProps) {
  const tableState = useTableState({
    page: 1,
    pageSize: 10,
  })

  // Compute filter options
  const statusOptions = useMemo<FilterOption[]>(() => [
    { value: 'backlog', label: 'Backlog' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'in-review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ], [])

  const priorityOptions = useMemo<FilterOption[]>(() => [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ], [])

  // Apply filtering and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks]

    // Apply status filter
    const statusFilter = tableState.state.filters?.status
    if (statusFilter) {
      result = result.filter((task) => task.status === statusFilter)
    }

    // Apply priority filter
    const priorityFilter = tableState.state.filters?.priority
    if (priorityFilter) {
      result = result.filter((task) => task.priority === priorityFilter)
    }

    // Apply search across title
    const searchQuery = tableState.state.filters?.search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((task) => task.title.toLowerCase().includes(query))
    }

    // Apply sorting
    if (tableState.sorting.length > 0) {
      const sort = tableState.sorting[0]
      result.sort((a, b) => {
        let aVal: any = a[sort.id as keyof Task]
        let bVal: any = b[sort.id as keyof Task]

        // Handle undefined/null values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sort.desc ? -1 : 1
        if (bVal == null) return sort.desc ? 1 : -1

        // Handle string comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal)
          return sort.desc ? -comparison : comparison
        }

        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.desc ? bVal - aVal : aVal - bVal
        }

        // Fallback
        if (aVal < bVal) return sort.desc ? 1 : -1
        if (aVal > bVal) return sort.desc ? -1 : 1
        return 0
      })
    }

    return result
  }, [tasks, tableState.state.filters, tableState.sorting])

  // Apply pagination
  const paginatedTasks = useMemo(() => {
    const start = (tableState.page - 1) * tableState.pageSize
    const end = start + tableState.pageSize
    return filteredAndSortedTasks.slice(start, end)
  }, [filteredAndSortedTasks, tableState.page, tableState.pageSize])

  const handleSearchChange = (value: string) => {
    tableState.setColumnFilters([
      {
        id: 'search',
        value,
      },
    ])
  }

  const handleStatusFilterChange = (key: string, value: string | undefined) => {
    tableState.setColumnFilters([
      {
        id: 'status',
        value: value || '',
      },
    ])
  }

  const handlePriorityFilterChange = (key: string, value: string | undefined) => {
    tableState.setColumnFilters([
      {
        id: 'priority',
        value: value || '',
      },
    ])
  }

  const handleSort = (columnId: string) => {
    tableState.setSorting((prev) => {
      const existing = prev.find((s) => s.id === columnId)
      if (existing) {
        return [{ id: columnId, desc: !existing.desc }]
      }
      return [{ id: columnId, desc: false }]
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 h-12 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No tasks available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <SearchBar
          value={tableState.state.filters?.search ?? ''}
          onChange={handleSearchChange}
          placeholder="Search tasks by title..."
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <FilterControls
            filters={tableState.state.filters ?? {}}
            onFilterChange={(key, value) => {
              if (key === 'status') handleStatusFilterChange(key, value)
              if (key === 'priority') handlePriorityFilterChange(key, value)
            }}
            filterConfigs={[
              { key: 'status', label: 'Status', options: statusOptions },
              { key: 'priority', label: 'Priority', options: priorityOptions },
            ]}
          />

          {tableState.hasActiveFilters && (
            <button
              onClick={tableState.clearFilters}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No tasks match the current filters</p>
        </div>
      ) : (
        <>
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('title')}
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      Title
                      {tableState.sorting[0]?.id === 'title' &&
                        (tableState.sorting[0]?.desc ? ' ↓' : ' ↑')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="text-slate-300 hover:text-white font-medium"
                    >
                      Status
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('priority')}
                      className="text-slate-300 hover:text-white font-medium"
                    >
                      Priority
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      Created
                      {tableState.sorting[0]?.id === 'createdAt' &&
                        (tableState.sorting[0]?.desc ? ' ↓' : ' ↑')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('deadline')}
                      className="text-slate-300 hover:text-white font-medium"
                    >
                      Deadline
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-white">{task.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[task.status]}`}
                      >
                        {task.status === 'in-progress'
                          ? 'In Progress'
                          : task.status === 'in-review'
                            ? 'In Review'
                            : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={tableState.page}
            pageSize={tableState.pageSize}
            totalItems={filteredAndSortedTasks.length}
            onPageChange={tableState.setPage}
            onPageSizeChange={tableState.setPageSize}
          />
        </>
      )}
    </div>
  )
}
