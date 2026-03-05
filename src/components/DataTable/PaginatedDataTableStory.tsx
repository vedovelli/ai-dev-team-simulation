import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { PaginatedDataTable } from './PaginatedDataTable'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import type { Task } from '../../types/task'

interface PaginatedDataTableStoryProps {
  totalItems?: number
}

function generateMockTasks(start: number, count: number): Task[] {
  const statuses: Array<'backlog' | 'in-progress' | 'in-review' | 'done'> = [
    'backlog',
    'in-progress',
    'in-review',
    'done',
  ]
  const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
  const teams = ['Backend', 'Frontend', 'DevOps', 'QA', 'Design']
  const assignees = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
  const sprints = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4']

  const tasks: Task[] = []

  for (let i = start; i < start + count; i++) {
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90))

    tasks.push({
      id: `TASK-${String(i + 1).padStart(4, '0')}`,
      title: `Task ${i + 1}: ${['Implement feature', 'Fix critical bug', 'Optimize performance', 'Update documentation', 'Refactor legacy code'][Math.floor(Math.random() * 5)]}`,
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

export function PaginatedDataTableStory({ totalItems = 234 }: PaginatedDataTableStoryProps) {
  const taskColumns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 100,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => (
          <div className="max-w-xs truncate">{info.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue<string>()
          const statusColors: Record<string, string> = {
            backlog: 'bg-gray-100 text-gray-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            'in-review': 'bg-yellow-100 text-yellow-800',
            done: 'bg-green-100 text-green-800',
          }
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const priority = info.getValue<string>()
          const priorityColors: Record<string, string> = {
            low: 'text-blue-600',
            medium: 'text-yellow-600',
            high: 'text-red-600',
          }
          return (
            <span className={`font-medium ${priorityColors[priority] || 'text-gray-600'}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          )
        },
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
      },
      {
        accessorKey: 'team',
        header: 'Team',
      },
      {
        accessorKey: 'storyPoints',
        header: 'Points',
        cell: (info) => <div className="text-center">{info.getValue<number>()}</div>,
      },
    ],
    []
  )

  // Simulate paginated query with mock data
  const query = usePaginatedQuery({
    queryKey: ['tasks'],
    queryFn: async (params) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      const start = (params.page - 1) * params.pageSize
      const data = generateMockTasks(start, params.pageSize)

      return {
        data,
        total: totalItems,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(totalItems / params.pageSize),
      }
    },
    initialPageSize: 10,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Paginated Data Table</h2>
        <p className="text-slate-600 mt-2">
          Integrates with TanStack Query pagination. Shows {totalItems.toLocaleString()} total tasks with
          responsive design and keyboard navigation.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-1">✓ Sortable Columns</h3>
          <p className="text-sm text-blue-800">Click headers to sort ascending/descending</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-1">✓ Pagination Controls</h3>
          <p className="text-sm text-green-800">First, Previous, Next, Last buttons</p>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-1">✓ Page Size Selector</h3>
          <p className="text-sm text-purple-800">Choose 10, 25, 50, or 100 items</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-1">✓ Loading States</h3>
          <p className="text-sm text-orange-800">Visual feedback during data loading</p>
        </div>
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
          <h3 className="font-semibold text-cyan-900 mb-1">✓ Mobile Responsive</h3>
          <p className="text-sm text-cyan-800">Works great on all screen sizes</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900 mb-1">✓ Keyboard Navigation</h3>
          <p className="text-sm text-red-800">Arrow keys, Home, End support</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <PaginatedDataTable columns={taskColumns} query={query} />
      </div>

      {/* Accessibility Guide */}
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-900 mb-3">Keyboard Navigation Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-amber-900">
          <div>
            <kbd className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono">
              ↑/↓
            </kbd>
            {' '}Move between rows
          </div>
          <div>
            <kbd className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono">
              Home
            </kbd>
            {' '}Jump to first row
          </div>
          <div>
            <kbd className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono">
              End
            </kbd>
            {' '}Jump to last row
          </div>
          <div>Click column headers to sort data</div>
        </div>
      </div>

      {/* Features Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-3">Pagination Features</h3>
          <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
            <li>Page size selector with preset options</li>
            <li>Current page and total pages display</li>
            <li>Item count display (e.g., "Showing 1-10 of 234")</li>
            <li>First/Last page quick navigation</li>
            <li>Disabled state when at page boundaries</li>
            <li>Automatic integration with TanStack Query</li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold mb-3">UI/UX Considerations</h3>
          <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
            <li>Responsive layout on mobile and desktop</li>
            <li>Clear visual feedback for loading and errors</li>
            <li>Accessible focus states and ARIA labels</li>
            <li>Smooth transitions and hover effects</li>
            <li>Virtual scrolling for performance</li>
            <li>Keyboard navigation support</li>
          </ul>
        </div>
      </div>

      {/* Usage Example */}
      <div className="p-6 bg-slate-900 rounded-lg border border-slate-700 overflow-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Usage Example</h3>
        <pre className="text-sm text-slate-300 font-mono overflow-auto">
{`const columns = useMemo<ColumnDef<Task>[]>(
  () => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'title', header: 'Title' },
    // ... more columns
  ],
  []
)

const query = usePaginatedQuery({
  queryKey: ['tasks'],
  queryFn: (params) => fetchTasks(params),
  initialPageSize: 10,
})

return (
  <PaginatedDataTable
    columns={columns}
    query={query}
    enableSorting={true}
    pageSizeOptions={[10, 25, 50, 100]}
  />
)`}
        </pre>
      </div>
    </div>
  )
}
