/**
 * Task Monitoring Dashboard Component
 *
 * Displays real-time task monitoring with virtual scrolling for high-performance
 * rendering of task logs and progress indicators.
 *
 * Features:
 * - Virtual scrolling for 500+ tasks
 * - Real-time progress indicators
 * - Error handling with retry actions
 * - Task filtering and sorting
 * - Status badges with color coding
 */

import { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@/types/task'
import { useTaskMonitor } from '@/hooks/useTaskMonitor'
import { useAgents } from '@/hooks/useAgents'
import { TaskAssignmentModal } from '../TaskAssignmentModal'
import { MutationErrorAlert } from '../MutationErrorAlert'

export interface TaskMonitoringDashboardProps {
  /** Poll interval in milliseconds (default: 5000) */
  pollIntervalMs?: number
  /** Task status to filter by */
  statusFilter?: TaskStatus | null
  /** Team to filter by */
  teamFilter?: string | null
  /** Assignee to filter by */
  assigneeFilter?: string | null
  /** Estimated row height in pixels (default: 50) */
  estimateSize?: number
  /** Overscan count for virtual scrolling (default: 10) */
  overscan?: number
}

// Status badge styling
function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'backlog':
      return 'bg-slate-100 text-slate-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'in-review':
      return 'bg-yellow-100 text-yellow-800'
    case 'done':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

// Priority badge styling
function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

// Progress indicator component
function ProgressIndicator({ status }: { status: TaskStatus }) {
  const progressMap: Record<TaskStatus, number> = {
    backlog: 0,
    'in-progress': 50,
    'in-review': 75,
    done: 100,
  }

  const progress = progressMap[status]

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
        {progress}%
      </span>
    </div>
  )
}

export function TaskMonitoringDashboard({
  pollIntervalMs = 5000,
  statusFilter = null,
  teamFilter = null,
  assigneeFilter = null,
  estimateSize = 50,
  overscan = 10,
}: TaskMonitoringDashboardProps) {
  const { data: tasks = [], isLoading, error, retry, isRecoverable, taskCount } =
    useTaskMonitor({
      pollIntervalMs,
      statusFilter,
      teamFilter,
      assigneeFilter,
      enabled: true,
    })

  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { data: agents = [] } = useAgents()

  // Define columns for the monitoring dashboard
  const columns: ColumnDef<Task>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 100,
      },
      {
        accessorKey: 'title',
        header: 'Task Title',
        size: 250,
        cell: (info) => (
          <div className="truncate font-medium text-slate-900">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Progress',
        size: 200,
        cell: (info) => <ProgressIndicator status={info.getValue() as TaskStatus} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        cell: (info) => {
          const status = info.getValue() as TaskStatus
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 100,
        cell: (info) => {
          const priority = info.getValue() as TaskPriority
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
              {priority}
            </span>
          )
        },
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
        size: 150,
        cell: (info) => (
          <div className="text-sm text-slate-700">{(info.getValue() as string) || '—'}</div>
        ),
      },
      {
        accessorKey: 'team',
        header: 'Team',
        size: 120,
        cell: (info) => (
          <div className="text-sm text-slate-700">{(info.getValue() as string) || '—'}</div>
        ),
      },
      {
        accessorKey: 'storyPoints',
        header: 'Points',
        size: 80,
        cell: (info) => (
          <div className="text-sm font-semibold text-slate-900">
            {(info.getValue() as number) || 0}
          </div>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        size: 180,
        cell: (info) => {
          const date = new Date(info.getValue() as string)
          return (
            <div className="text-xs text-slate-600">
              {date.toLocaleString()}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        cell: (info) => {
          const task = info.row.original
          return (
            <button
              onClick={() => setSelectedTask(task)}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Assign
            </button>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0

  // Loading state
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading task monitoring data...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (tasks.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-12">
        <div className="text-center">
          <p className="text-slate-600 font-medium">No tasks to monitor</p>
          {statusFilter && (
            <p className="text-sm text-slate-500 mt-1">
              Adjust your filters to see more tasks
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <MutationErrorAlert
          error={error as Error}
          canRetry={isRecoverable}
          onRetry={retry}
        />
      )}

      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Task Monitoring</h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitoring {taskCount} task{taskCount !== 1 ? 's' : ''} • Updates every {pollIntervalMs / 1000}s
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Fetching updates...
          </div>
        )}
      </div>

      {/* Virtualized Table */}
      <div
        ref={tableContainerRef}
        className="rounded-lg border border-slate-200 overflow-auto bg-white"
        style={{ height: '600px' }}
        role="region"
        aria-label="Task monitoring table with virtual scrolling"
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-semibold text-slate-700 bg-slate-100 border-b border-slate-300 cursor-pointer hover:bg-slate-200 transition-colors"
                      style={{ width: `${header.getSize()}px` }}
                      onClick={header.column.getToggleSortingHandler()}
                      role="columnheader"
                      aria-sort={
                        isSorted
                          ? isSorted === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {isSorted && (
                          <span className="text-xs">
                            {isSorted === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index]
              return (
                <tr
                  key={row.id}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm"
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="text-xs text-slate-600 flex justify-between items-center">
        <span>Showing {rows.length} task{rows.length !== 1 ? 's' : ''}</span>
        <span>Last update: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Task Assignment Modal */}
      {selectedTask && (
        <TaskAssignmentModal
          task={selectedTask}
          agents={agents}
          isOpen={true}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
