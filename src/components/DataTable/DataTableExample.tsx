import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './DataTable'
import { useDataTableState } from './useDataTableState'
import { useDataTableQuery } from './useDataTableQuery'
import { TextFilter, SelectFilter, FilterGroup } from './FilterComponents'
import type { Task } from '../../types/task'

interface DataTableExampleProps {
  enableFiltering?: boolean
}

export function DataTableExample({ enableFiltering = true }: DataTableExampleProps) {
  const tableState = useDataTableState({
    initialPageSize: 25,
  })

  // Fetch data from the virtualized-tasks endpoint
  const { data, total, isLoading, isError } = useDataTableQuery<Task>({
    endpoint: '/api/virtualized-tasks',
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    sorting: tableState.sorting,
    columnFilters: enableFiltering ? tableState.columnFilters : [],
  })

  // Define columns with type-safe generics
  const columns = useMemo<ColumnDef<Task>[]>(
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
        accessorKey: 'team',
        header: 'Team',
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
      },
      {
        accessorKey: 'storyPoints',
        header: 'Story Points',
        cell: (info) => <div className="text-center">{info.getValue<number>()}</div>,
      },
    ],
    []
  )

  // Get current filter values
  const statusFilterValue = tableState.columnFilters.find(
    (f) => f.id === 'status'
  )?.value as string | undefined

  const priorityFilterValue = tableState.columnFilters.find(
    (f) => f.id === 'priority'
  )?.value as string | undefined

  const searchFilterValue = tableState.columnFilters.find(
    (f) => f.id === 'search'
  )?.value as string | undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tasks Data Table</h1>
        <p className="text-slate-600 mt-1">
          Virtualized data table with filtering, sorting, and pagination
        </p>
      </div>

      <DataTable
        data={data}
        columns={columns}
        pageIndex={tableState.pageIndex}
        pageSize={tableState.pageSize}
        total={total}
        sorting={tableState.sorting}
        columnFilters={tableState.columnFilters}
        isLoading={isLoading}
        isError={isError}
        enableSorting
        enableFiltering={enableFiltering}
        onPageIndexChange={tableState.setPageIndex}
        onPageSizeChange={tableState.setPageSize}
        onSortingChange={tableState.setSorting}
        onFiltersChange={(filters) => {
          tableState.setColumnFilters(filters)
          tableState.resetPagination()
        }}
        renderFilters={
          enableFiltering && (
            <FilterGroup>
              <TextFilter
                id="search"
                label="Search Title"
                value={searchFilterValue}
                onChange={(filters) => {
                  tableState.setColumnFilters(filters)
                  tableState.resetPagination()
                }}
                placeholder="Search by title..."
              />
              <SelectFilter
                id="status"
                label="Status"
                value={statusFilterValue}
                options={[
                  { label: 'Backlog', value: 'backlog' },
                  { label: 'In Progress', value: 'in-progress' },
                  { label: 'In Review', value: 'in-review' },
                  { label: 'Done', value: 'done' },
                ]}
                onChange={(filters) => {
                  tableState.setColumnFilters(filters)
                  tableState.resetPagination()
                }}
              />
              <SelectFilter
                id="priority"
                label="Priority"
                value={priorityFilterValue}
                options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ]}
                onChange={(filters) => {
                  tableState.setColumnFilters(filters)
                  tableState.resetPagination()
                }}
              />
            </FilterGroup>
          )
        }
      />
    </div>
  )
}
