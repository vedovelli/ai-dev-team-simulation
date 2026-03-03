import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './DataTable'
import type { User, UserRole } from '../../types/user'

interface UsersTableProps {
  data: User[]
  isLoading?: boolean
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span className="text-blue-600">↑</span>
  if (isSorted === 'desc') return <span className="text-blue-600">↓</span>
  return <span className="text-gray-300">⇅</span>
}

export function UsersTable({ data, isLoading = false }: UsersTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        pageSize={10}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      />
    </div>
  )
}
