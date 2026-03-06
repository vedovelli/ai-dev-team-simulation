import React from 'react'
import { SimpleTable } from './SimpleTable'
import { type ColumnConfig } from '../../hooks/useTable'

interface User {
  id: number
  name: string
  email: string
  role: string
  joinDate: string
  status: 'active' | 'inactive'
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Admin',
    joinDate: '2024-01-15',
    status: 'active',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'User',
    joinDate: '2024-02-20',
    status: 'active',
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'Moderator',
    joinDate: '2024-01-10',
    status: 'inactive',
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@example.com',
    role: 'User',
    joinDate: '2024-03-05',
    status: 'active',
  },
  {
    id: 5,
    name: 'Ethan Hunt',
    email: 'ethan@example.com',
    role: 'Admin',
    joinDate: '2023-12-01',
    status: 'active',
  },
]

const userColumns: ColumnConfig<User>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    filterable: true,
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    filterable: true,
  },
  {
    key: 'joinDate',
    label: 'Join Date',
    sortable: true,
    filterable: false,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    render: (value: 'active' | 'inactive') => (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
          value === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    ),
  },
]

/**
 * Example implementation of SimpleTable with mock user data
 * Demonstrates:
 * - Basic table setup with typed data
 * - Sortable columns
 * - Filterable columns
 * - Custom rendering with Tailwind styling
 * - Type safety with TypeScript
 */
export function SimpleTableExample() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Users Table
        </h1>
        <p className="text-gray-600 mb-8">
          This table demonstrates the useTable hook with sorting and filtering
          capabilities. Click column headers to sort, or use the search box to
          filter by name, email, role, or status.
        </p>

        <SimpleTable<User>
          data={mockUsers}
          columns={userColumns}
          emptyMessage="No users found matching your search"
        />

        {/* Documentation section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            API Documentation
          </h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                SimpleTable Props
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    data: T[]
                  </code>
                  - Array of row data
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    columns: ColumnConfig&lt;T&gt;[]
                  </code>
                  - Column configuration array
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    isLoading?: boolean
                  </code>
                  - Optional loading state
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    emptyMessage?: string
                  </code>
                  - Message when no data is displayed
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ColumnConfig Interface
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    key: keyof T
                  </code>
                  - Column accessor key
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    label: string
                  </code>
                  - Header label
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    sortable?: boolean
                  </code>
                  - Enable/disable sorting (default: true)
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    filterable?: boolean
                  </code>
                  - Include in search filter (default: true)
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    render?: (value) =&gt; ReactNode
                  </code>
                  - Custom cell renderer
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                useTable Hook Return
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    displayedData: T[]
                  </code>
                  - Sorted and filtered data
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    sortKey?: keyof T
                  </code>
                  - Current sort column
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    sortDirection: 'asc' | 'desc'
                  </code>
                  - Current sort direction
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    searchTerm: string
                  </code>
                  - Current filter text
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    toggleSort(key): void
                  </code>
                  - Toggle sort on column
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    setSearchTerm(term): void
                  </code>
                  - Update search filter
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    getSortIcon(key): '↑' | '↓' | null
                  </code>
                  - Get current sort indicator
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Migration Path to TanStack Table
              </h3>
              <p className="text-blue-800 text-xs">
                This hook is designed to provide 80% of TanStack Table's
                functionality with minimal complexity. When requirements grow,
                you can migrate to TanStack Table by using the same ColumnConfig
                interface to generate TanStack ColumnDef objects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
