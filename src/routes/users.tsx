import { createFileRoute } from '@tanstack/react-router'
import { useUsers } from '../hooks/useUsers'
import { UsersTable } from '../components/Table/UsersTable'

function UsersPage() {
  const { data: users = [], isLoading, error } = useUsers()

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-8 text-red-600">
        Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">Manage and view all users in the system</p>
      </div>
      <UsersTable data={users} isLoading={isLoading} />
    </div>
  )
}

export const Route = createFileRoute('/users')({
  component: UsersPage,
})
