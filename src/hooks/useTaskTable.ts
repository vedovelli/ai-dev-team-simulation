import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import type { Task } from '../types/task'

interface UseTaskTableProps {
  data: Task[]
  sorting: SortingState
  setSorting: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  setColumnFilters: (filters: ColumnFiltersState) => void
}

/**
 * Column definitions for the tasks table
 *
 * Defines how data maps to columns, including formatting and sorting behavior.
 * Each column specifies an accessor key or accessor function to read data from Task objects.
 *
 * @see docs/guides/tanstack-table.md for column definition patterns
 */
const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue() as string
      const statusLabels: Record<string, string> = {
        backlog: 'Backlog',
        'in-progress': 'In Progress',
        'in-review': 'In Review',
        done: 'Done',
      }
      return statusLabels[status] || status
    },
  },
  {
    accessorKey: 'team',
    header: 'Team',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'sprint',
    header: 'Sprint',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: (info) => {
      const priority = info.getValue() as string
      const priorityLabels: Record<string, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      }
      return priorityLabels[priority] || priority
    },
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'storyPoints',
    header: 'Points',
    cell: (info) => info.getValue(),
  },
]

/**
 * Create a table instance for tasks with sorting and filtering
 *
 * Uses TanStack Table (React Table) to manage table state including sorting and column filters.
 * The hook accepts table state from the parent component, allowing the parent to control
 * and persist the state.
 *
 * @param props - Table configuration including data and state handlers
 * @returns Object containing the table instance and column definitions
 *
 * @example
 * // In parent component
 * const [sorting, setSorting] = useState<SortingState>([])
 * const [filters, setFilters] = useState<ColumnFiltersState>([])
 * const { data: tasks } = useTasks()
 *
 * const { table, columns } = useTaskTable({
 *   data: tasks || [],
 *   sorting,
 *   setSorting,
 *   columnFilters: filters,
 *   setColumnFilters: setFilters,
 * })
 *
 * // Render the table
 * return (
 *   <table>
 *     <tbody>
 *       {table.getRowModel().rows.map(row => (
 *         <tr key={row.id}>
 *           {row.getVisibleCells().map(cell => (
 *             <td key={cell.id}>
 *               {flexRender(cell.column.columnDef.cell, cell.getContext())}
 *             </td>
 *           ))}
 *         </tr>
 *       ))}
 *     </tbody>
 *   </table>
 * )
 *
 * @see docs/guides/tanstack-table.md for rendering patterns
 */
export function useTaskTable({
  data,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
}: UseTaskTableProps) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return {
    table,
    columns,
  }
}
