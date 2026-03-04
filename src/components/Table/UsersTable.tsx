import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './DataTable'
import type { User, UserRole, UserStatus } from '../../types/user'

interface UsersTableProps {
  data: User[]
  isLoading?: boolean
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span className="text-blue-600">↑</span>
  if (isSorted === 'desc') return <span className="text-blue-600">↓</span>
  return <span className="text-gray-300">⇅</span>
}

function StatusBadge({ status }: { status?: UserStatus }) {
  if (!status) return <span className="text-gray-500 text-sm">-</span>

  const statusColors: Record<UserStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }

  const statusLabels: Record<UserStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
  }

  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

export function UsersTable({ data, isLoading = false }: UsersTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
  })

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold hover:text-blue-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ID
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold hover:text-blue-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold hover:text-blue-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => <span className="text-sm">{info.getValue()}</span>,
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'role',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold hover:text-blue-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Role
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => {
          const role = info.getValue() as UserRole
          const roleLabels: Record<UserRole, string> = {
            admin: 'Admin',
            developer: 'Developer',
            manager: 'Manager',
          }
          const roleColors: Record<UserRole, string> = {
            admin: 'bg-red-100 text-red-800',
            developer: 'bg-blue-100 text-blue-800',
            manager: 'bg-purple-100 text-purple-800',
          }
          return (
            <span
              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${roleColors[role]}`}
            >
              {roleLabels[role]}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold hover:text-blue-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Status
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => <StatusBadge status={info.getValue() as UserStatus} />,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold hover:text-blue-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Created
            <SortIcon isSorted={column.getIsSorted()} />
          </button>
        ),
        cell: (info) => {
          const date = new Date(info.getValue() as string)
          return <span className="text-sm text-gray-600">{date.toLocaleDateString()}</span>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <div className="flex gap-2">
            <button className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded">
              View
            </button>
            <button className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">
              Edit
            </button>
          </div>
        ),
      },
    ],
    []
  )

  const filteredColumns = useMemo(
    () => columns.filter((col) => {
      const accessorKey = (col as any).accessorKey
      return accessorKey ? visibleColumns[accessorKey as keyof typeof visibleColumns] !== false : true
    }),
    [columns, visibleColumns]
  )

  const columnOptions = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
        </div>

        {/* Column visibility toggles */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Show columns:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {columnOptions.map((col) => (
              <label key={col.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key as keyof typeof visibleColumns]}
                  onChange={(e) => {
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [col.key]: e.target.checked,
                    }))
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {data.length === 0 && !isLoading ? (
        <div className="rounded-lg bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">No users found</p>
        </div>
      ) : (
        <DataTable
          data={data}
          columns={filteredColumns}
          isLoading={isLoading}
          pageSize={10}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
        />
      )}
    </div>
  )
}
