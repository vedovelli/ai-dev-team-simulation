import { createFileRoute } from '@tanstack/react-router'
import { useAgents } from '../../hooks/useAgents'
import { AgentCard } from '../../components/AgentCard'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import { Suspense } from 'react'

/* eslint-disable react-refresh/only-export-components */

// Pre-fetch agents data when route loader runs
async function loadAgents() {
  // The query client is available in Route.useRouteContext()
  // Data will be loaded via the query hook below
  return null
}

function AgentsDashboard() {
  const { data: response, isLoading, error } = useAgents()
  const agents = response?.data ?? []

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-500">Loading agents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <RouteErrorBoundary
        error={error}
        resetError={() => window.location.reload()}
      />
    )
  }

  if (agents.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-500">No agents available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-slate-400 text-sm sm:text-base">Manage and monitor your team agents</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentsDashboardWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-white">
          <h1 className="text-3xl font-bold mb-8">Agent Dashboard</h1>
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-400">Loading agents...</p>
          </div>
        </div>
      }
    >
      <AgentsDashboard />
    </Suspense>
  )
}

export const Route = createFileRoute('/agents/')({
  component: AgentsDashboardWithSuspense,
  loader: loadAgents,
  errorComponent: ({ error }) => (
    <RouteErrorBoundary error={error} />
  ),
})
