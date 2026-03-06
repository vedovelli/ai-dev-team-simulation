import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ColumnDef,
  Header,
} from '@tanstack/react-table'
import { VirtualizedDataTable, useVirtualizedTableState } from '../components/VirtualizedDataTable'
import { EnhancedDataTable } from '../components/DataTable'
import { PaginatedDataTableStory } from '../components/DataTable/PaginatedDataTableStory'
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
  column: Header<T, unknown>
  children: React.ReactNode
}) {
  return (
    <button
      onClick={() => column.column.toggleSorting(column.column.getIsSorted() === 'asc')}
      className="flex items-center gap-1 font-semibold hover:text-blue-600 cursor-pointer"
    >
      {children}
      <SortIcon isSorted={column.column.getIsSorted()} />
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
    id: 'estimatedHours',
    accessorKey: 'estimatedHours',
    header: ({ column }) => (
      <SortableColumnHeader column={column}>Est. Hours</SortableColumnHeader>
    ),
    cell: (info) => {
      const hours = info.getValue() as number | undefined
      return <span className="text-center">{hours ? `${hours}h` : '—'}</span>
    },
    size: 90,
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

function DataTablesPage() {
  const tableState = useVirtualizedTableState()
  const urlTableState = useTableState({ pageSize: 10 })
  const [dataSize, setDataSize] = useState(1000)

  const tasks = useMemo(() => generateMockTasks(dataSize), [dataSize])

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Virtualized Data Tables Demo</h1>
        <p className="text-slate-600">
          High-performance data tables with TanStack Table and React Virtual. Displays {dataSize.toLocaleString()} rows with smooth scrolling and full sorting/filtering capabilities.
        </p>
      </div>

      {/* Data Size Controls */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <label htmlFor="data-size" className="font-semibold text-slate-700">
            Dataset Size:
          </label>
          <select
            id="data-size"
            value={dataSize}
            onChange={(e) => setDataSize(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={100}>100 rows</option>
            <option value={500}>500 rows</option>
            <option value={1000}>1,000 rows</option>
            <option value={5000}>5,000 rows</option>
            <option value={10000}>10,000 rows</option>
          </select>
        </div>
        <button
          onClick={() => {
            tableState.resetState()
            urlTableState.clearAllState()
          }}
          className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-medium"
        >
          Reset Filters
        </button>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-1">Virtual Scrolling</h3>
          <p className="text-sm text-blue-800">Efficient rendering of 1000+ rows</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-1">Column Sorting</h3>
          <p className="text-sm text-green-800">Click headers to sort</p>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-1">Global Search</h3>
          <p className="text-sm text-purple-800">Filter across all columns</p>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-900 mb-1">Keyboard Nav</h3>
          <p className="text-sm text-amber-800">Arrow keys to navigate rows</p>
        </div>
      </div>

      {/* URL State Info */}
      {urlTableState.hasActiveState && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">URL State Persistence</h3>
          <p className="text-sm text-blue-800 mb-2">
            Your table state is persisted in the URL! Try:
          </p>
          <ul className="space-y-1 text-sm text-blue-800 list-disc list-inside">
            {urlTableState.hasActiveSorting && <li>Click column headers to sort (state saved to URL)</li>}
            {urlTableState.hasActiveFilters && <li>Filters are saved in URL query params</li>}
            <li>Share the URL to preserve this exact table view</li>
            <li>Use browser back/forward buttons to restore previous states</li>
          </ul>
        </div>
      )}

      {/* Virtualized Table */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Tasks Table</h2>
        <VirtualizedDataTable
          data={tasks}
          columns={taskColumns}
          globalFilter={tableState.globalFilter}
          onGlobalFilterChange={tableState.setGlobalFilter}
          columnVisibility={tableState.columnVisibility}
          onColumnVisibilityChange={tableState.setColumnVisibility}
          enableSorting={true}
          enableFiltering={true}
          keyboardNavigation={true}
          estimateSize={50}
          overscan={10}
          emptyMessage="No tasks found. Try adjusting your filters."
          rowClassName={(row, index) => {
            if (index % 2 === 0) return 'bg-slate-50'
            return ''
          }}
        />
      </div>

      {/* Feature Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-3">Column Visibility</h3>
          <p className="text-slate-700 mb-3">Toggle column visibility above the table to customize your view. Your preferences are persisted in component state.</p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Hide non-essential columns</li>
            <li>Focus on relevant data</li>
            <li>Reduce horizontal scrolling</li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-3">Keyboard Navigation</h3>
          <p className="text-slate-700 mb-3">Navigate with keyboard for accessibility. Try these shortcuts:</p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li><kbd className="px-2 py-1 bg-white border border-slate-300 rounded">↑/↓</kbd> Move between rows</li>
            <li><kbd className="px-2 py-1 bg-white border border-slate-300 rounded">Home</kbd> First row</li>
            <li><kbd className="px-2 py-1 bg-white border border-slate-300 rounded">End</kbd> Last row</li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-3">Global Search</h3>
          <p className="text-slate-700 mb-3">The search input above the table filters across all columns in real-time:</p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Search by task ID or title</li>
            <li>Filter by assignee name</li>
            <li>Find tasks in specific sprints</li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-3">Performance</h3>
          <p className="text-slate-700 mb-3">Virtualization ensures smooth performance even with large datasets:</p>
          <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Only visible rows are rendered</li>
            <li>Smooth 60fps scrolling</li>
            <li>Minimal memory footprint</li>
          </ul>
        </div>
      </div>

      {/* Keyboard Instructions */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Accessibility Features</h3>
        <p className="text-blue-800 mb-3">This table implements WCAG AA compliance:</p>
        <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
          <li>Semantic HTML with proper ARIA roles and attributes</li>
          <li>Keyboard navigation with arrow keys, Home, and End</li>
          <li>Sortable columns announced via aria-sort</li>
          <li>Screen reader support for row and column information</li>
          <li>High contrast colors for visual accessibility</li>
          <li>Focus management and visual focus indicators</li>
        </ul>
      </div>

      {/* Enhanced Data Table Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Enhanced Data Table (FAB-19)</h2>
        <p className="text-slate-600 mb-4">Reusable table component with filtering, sorting, pagination, column visibility, and row selection:</p>
        <EnhancedDataTable
          data={tasks.slice(0, 50)}
          columns={taskColumns}
          pageSize={10}
          enableColumnFilters={true}
          enableColumnVisibility={true}
          enableRowSelection={true}
          onRowSelect={(selectedRows) => {
            console.log('Selected rows:', Array.from(selectedRows))
          }}
        />
      </div>

      {/* Enhanced Table Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Text Filtering</h3>
          <p className="text-green-800 mb-3">Search across all columns in real-time using the global search input.</p>
          <ul className="space-y-2 text-sm text-green-800 list-disc list-inside">
            <li>Filter by task title</li>
            <li>Filter by assignee</li>
            <li>Filter by status or priority</li>
          </ul>
        </div>

        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">Single Column Sort</h3>
          <p className="text-purple-800 mb-3">Click column headers to sort ascending or descending. Visual indicator shows sort direction.</p>
          <ul className="space-y-2 text-sm text-purple-800 list-disc list-inside">
            <li>Click header to toggle sort</li>
            <li>Arrow indicators (↑/↓)</li>
            <li>Works with any column</li>
          </ul>
        </div>

        <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">Row Selection</h3>
          <p className="text-orange-800 mb-3">Select individual rows or all rows on current page with checkboxes. State is managed via custom hook.</p>
          <ul className="space-y-2 text-sm text-orange-800 list-disc list-inside">
            <li>Individual row checkboxes</li>
            <li>Select all button</li>
            <li>Custom hook integration</li>
          </ul>
        </div>

        <div className="p-6 bg-cyan-50 rounded-lg border border-cyan-200">
          <h3 className="text-lg font-semibold text-cyan-900 mb-3">Column Visibility</h3>
          <p className="text-cyan-800 mb-3">Toggle visibility of any column using the button controls above the table.</p>
          <ul className="space-y-2 text-sm text-cyan-800 list-disc list-inside">
            <li>Hide/show columns dynamically</li>
            <li>Visual toggle buttons</li>
            <li>Customizable per column</li>
          </ul>
        </div>
      </div>

      {/* Paginated Data Table Section (FAB-49) */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <PaginatedDataTableStory totalItems={234} />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/data-tables')({
  component: DataTablesPage,
})
