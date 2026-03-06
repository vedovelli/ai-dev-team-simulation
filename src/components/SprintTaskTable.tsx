import { useMemo } from 'react'
import type { SprintTask, TaskStatus, TaskPriority } from '../types/sprint'
import { useTable } from '../hooks/useTable'

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

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
}

export interface SprintTaskTableProps {
  tasks: SprintTask[]
  isLoading?: boolean
}

export function SprintTaskTable({ tasks, isLoading }: SprintTaskTableProps) {
  const { sortedAndFilteredData, handleSort, handleFilter, filterValue, sortKey, sortOrder } =
    useTable({
      data: tasks,
      initialSortKey: 'title',
    })

  const columns = useMemo(() => [
    { key: 'title' as const, label: 'Title' },
    { key: 'status' as const, label: 'Status' },
    { key: 'assignee' as const, label: 'Assignee' },
    { key: 'priority' as const, label: 'Priority' },
  ], [])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 h-12 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No tasks in this sprint</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Input */}
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Filter tasks..."
          value={filterValue}
          onChange={(e) => handleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort(column.key)}
                    className="text-slate-300 hover:text-white font-medium flex items-center gap-1 group"
                  >
                    {column.label}
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortKey === column.key && (sortOrder === 'asc' ? '↑' : '↓')}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedAndFilteredData.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-white">{task.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                    {task.status === 'in-progress' ? 'In Progress' :
                     task.status === 'in-review' ? 'In Review' :
                     task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-300">{task.assignee}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-400">
        Showing {sortedAndFilteredData.length} of {tasks.length} tasks
      </div>
    </div>
  )
}
