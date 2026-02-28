/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTeamMember } from '../hooks/useTeamMember'

export const Route = createFileRoute('/$memberId')({
  component: TeamMemberDetail,
  errorComponent: ({ error }) => {
    if (error.message === 'Not Found') {
      return (
        <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Member Not Found</h1>
            <p className="text-gray-300">The team member you're looking for doesn't exist.</p>
          </div>
        </main>
      )
    }
    throw error
  },
})

function TeamMemberDetail() {
  const { memberId } = Route.useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useTeamMember(memberId)

  if (error instanceof Error) {
    if (error.message === 'Failed to fetch team member') {
      throw new Error('Not Found')
    }
    throw error
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading member details...</p>
        </div>
      </main>
    )
  }

  if (!data) {
    throw new Error('Not Found')
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate({ to: '/' })}
          className="mb-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          ← Back to Team
        </button>

        <div className="bg-slate-800 rounded-lg p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-2">{data.name}</h1>
          <p className="text-gray-400 mb-6">{data.role}</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <StatCard
              label="Tasks Completed"
              value={data.tasksCompleted.toString()}
            />
            <StatCard
              label="Performance Score"
              value={`${data.performanceScore}%`}
            />
            <StatCard
              label="Current Status"
              value={data.status}
              isStatus
            />
            <StatCard
              label="Recent Activity"
              value={data.recentActivity}
              isLarge
            />
          </div>

          <div className="bg-slate-700 rounded p-4">
            <p className="text-sm text-gray-400">
              Member ID: <span className="text-white font-mono">{data.id}</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

interface StatCardProps {
  label: string
  value: string
  isStatus?: boolean
  isLarge?: boolean
}

function StatCard({ label, value, isStatus, isLarge }: StatCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400'
      case 'idle':
        return 'text-yellow-400'
      case 'offline':
        return 'text-red-400'
      default:
        return 'text-white'
    }
  }

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <p
        className={`text-2xl font-bold ${
          isStatus ? getStatusColor(value) : 'text-white'
        } ${isLarge ? 'text-sm' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}
