import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Team } from '../hooks/useCreateTeam'
import { RouteErrorBoundary } from '../components/RouteErrorBoundary'
import { Suspense } from 'react'

// Route loader for pre-fetching teams data
async function loadTeams() {
  // Data will be fetched via the query hook
  return null
}

export const Route = createFileRoute('/teams')({
  component: TeamsPageWrapper,
  loader: loadTeams,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})

function TeamsPage() {
  const router = useRouter()
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams')
      return response.json() as Promise<Team[]>
    },
  })

  if (error) {
    return (
      <RouteErrorBoundary
        error={error}
        resetError={() => window.location.reload()}
      />
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Teams</h1>
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400">Loading teams...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Teams</h1>
          <button
            onClick={() => router.navigate({ to: '/teams.new' })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Create Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-4">No teams yet</p>
            <button
              onClick={() => router.navigate({ to: '/teams.new' })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Create your first team
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-slate-800 p-6 rounded-lg border border-slate-700"
              >
                <h2 className="text-xl font-bold mb-2">{team.name}</h2>
                <p className="text-slate-300 mb-4">{team.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function TeamsPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-900 text-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Teams</h1>
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400">Loading teams...</p>
            </div>
          </div>
        </main>
      }
    >
      <TeamsPage />
    </Suspense>
  )
}
