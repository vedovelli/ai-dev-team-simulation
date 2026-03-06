import { useMemo, useState, useCallback } from 'react'
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import type { Employee } from '../../../types/employee'

export interface UseTableConfigOptions {
  enableColumnVisibility?: boolean
  enableRowSelection?: boolean
  enableColumnPinning?: boolean
}

export function useTableConfig(options: UseTableConfigOptions = {}) {
  const {
    enableColumnVisibility = true,
    enableRowSelection = true,
    enableColumnPinning = true,
  } = options

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Define employee columns with proper typing
  const columns = useMemo<ColumnDef<Employee>[]>(() => {
    const baseCols: ColumnDef<Employee>[] = [
      {
        id: 'select',
        header: ({ table }) =>
          enableRowSelection ? (
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              aria-label="Select all rows"
              className="rounded border-gray-300"
            />
          ) : null,
        cell: ({ row }) =>
          enableRowSelection ? (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
              aria-label={`Select row ${row.id}`}
              className="rounded border-gray-300"
            />
          ) : null,
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: 'position',
        header: 'Position',
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: 'salary',
        header: 'Salary',
        cell: (info) => {
          const value = info.getValue() as number
          return `$${value.toLocaleString()}`
        },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string
          const statusColors: Record<string, string> = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            'on-leave': 'bg-yellow-100 text-yellow-800',
          }
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                statusColors[status] || statusColors.inactive
              }`}
            >
              {status}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'joinDate',
        header: 'Join Date',
        cell: (info) => {
          const date = info.getValue() as string
          return new Date(date).toLocaleDateString()
        },
        enableSorting: true,
      },
    ]

    return baseCols
  }, [enableRowSelection])

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      setColumnVisibility((prev) => ({
        ...prev,
        [columnId]: !(prev[columnId] ?? true),
      }))
    },
    []
  )

  const resetColumnVisibility = useCallback(() => {
    setColumnVisibility({})
  }, [])

  return {
    columns,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    toggleColumnVisibility,
    resetColumnVisibility,
    rowSelection,
    setRowSelection,
    enableColumnVisibility,
    enableRowSelection,
    enableColumnPinning,
  }
}
