import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useAgents } from '../../hooks/useAgents'
import { AgentTable } from '../../components/AgentManagement/AgentTable'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import { Suspense } from 'react'
import type { Agent } from '../../types/agent'

/* eslint-disable react-refresh/only-export-components */

// Pre-fetch agents data when route loader runs
async function loadAgents() {
  // The query client is available in Route.useRouteContext()
  // Data will be loaded via the query hook below
  return null
}

function AgentsDashboard() {
  const navigate = useNavigate()
  const { data: agents = [], isLoading, error } = useAgents()

  const handleEdit = (agent: Agent) => {
    navigate({ to: `/agents/${agent.id}` })
  }

  const handleDelete = (agentId: string) => {
    // TODO: Implement delete confirmation and API call
    console.log('Delete agent:', agentId)
  }

  const handleViewDetails = (agentId: string) => {
    navigate({ to: `/agents/${agentId}` })
  }

  if (error) {
    return (
      <RouteErrorBoundary
        error={error}
        resetError={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-950 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Agent Management</h1>
            <p className="text-slate-400 text-sm sm:text-base">Manage and monitor your team agents</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/agents/performance"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
            >
              Performance Metrics
            </Link>
            <Link
              to="/agents/bulk-operations"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Bulk Operations
            </Link>
          </div>
        </header>

        <AgentTable
          agents={agents}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  )
}

function AgentsDashboardWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-white">
          <h1 className="text-3xl font-bold mb-8">Agent Management</h1>
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
