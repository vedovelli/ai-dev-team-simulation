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
