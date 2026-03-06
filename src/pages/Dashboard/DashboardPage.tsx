import { useMemo } from 'react'
import { useUsersQuery } from '../../hooks/queries/useUserQuery'
import { SimpleTable, SimpleTableColumn } from '../../components/SimpleTable'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { DashboardSkeleton, MetricCardSkeleton, TableSkeleton } from '../../components/Skeletons'
import type { User } from '../../types/user'

/**
 * Dashboard page displaying key metrics and recent user activity.
 * Uses TanStack Query for data fetching and the custom useTable hook for the activity table.
 */
export function DashboardPage() {
  const { data: users, isLoading, error } = useUsersQuery()

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!users) {
      return {
        totalUsers: 0,
        activeSessions: 0,
        recentActivity: 0,
      }
    }

    const totalUsers = users.length

    // Simulate active sessions (users with activity in the last hour)
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const activeSessions = users.filter((user) => {
      const lastActivityDate = new Date(user.lastActivityAt || '')
      return lastActivityDate > oneHourAgo
    }).length

    // Count recent activity (last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentActivity = users.filter((user) => {
      const lastActivityDate = new Date(user.lastActivityAt || '')
      return lastActivityDate > oneDayAgo
    }).length

    return {
      totalUsers,
      activeSessions,
      recentActivity,
    }
  }, [users])

  // Table columns configuration
  const userActivityColumns: SimpleTableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (role: string) => (
        <span className="inline-block rounded-full bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-300">
          {role}
        </span>
      ),
    },
    {
      key: 'lastActivityAt',
      label: 'Last Activity',
      sortable: true,
      render: (date: string) => {
        if (!date) return '—'
        const d = new Date(date)
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-2">Overview of key metrics and recent activity</p>
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-2">Overview of key metrics and recent activity</p>
          </div>
        </div>
        <div className="rounded-lg bg-red-900/30 border border-red-700 p-6">
          <h3 className="font-semibold text-red-300 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-200">{error instanceof Error ? error.message : 'An error occurred'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-2">Overview of key metrics and recent activity</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          subtitle="Active in system"
        />
        <MetricCard
          title="Active Sessions"
          value={metrics.activeSessions}
          subtitle="Last hour"
        />
        <MetricCard
          title="Recent Activity"
          value={metrics.recentActivity}
          subtitle="Last 24 hours"
        />
      </div>

      {/* Recent Activity Table */}
      <ErrorBoundary>
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Recent User Activity</h2>
          <SimpleTable<User>
            data={users || []}
            columns={userActivityColumns}
            emptyMessage="No users found"
          />
        </div>
      </ErrorBoundary>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number | string
  subtitle?: string
}

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className="text-4xl font-bold text-slate-100 mb-1">{value}</div>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  )
}
