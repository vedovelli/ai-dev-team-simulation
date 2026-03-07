import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useAgents } from '../../hooks/useAgents'
import { AgentTable } from '../../components/AgentManagement/AgentTable'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import { Suspense, useMemo, useState } from 'react'
import { AgentsSearchParamSchema, serializeAgentsSearchParams, deserializeAgentsSearchParams } from '../../lib/router-types'
import { AgentFormModal } from '../../components/AgentManagement/AgentFormModal'
import type { AgentManagement } from '../../types/agent'

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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedAgent, setSelectedAgent] = useState<AgentManagement | undefined>()

  const handleCreateAgent = () => {
    setSelectedAgent(undefined)
    setModalMode('create')
    setModalOpen(true)
  }

  const handleEditAgent = (agent: AgentManagement) => {
    setSelectedAgent(agent)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedAgent(undefined)
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
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Agent Management</h1>
              <p className="text-gray-600 text-sm sm:text-base">Create, manage, and monitor agents</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateAgent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                Create Agent
              </button>
              <Link
                to="/agents/performance"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
              >
                Performance
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-600">Loading agents...</p>
            </div>
          ) : error ? (
            <RouteErrorBoundary
              error={error as Error}
              resetError={() => window.location.reload()}
            />
          ) : agents.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-600">No agents yet. Create your first agent to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200">
              <AgentTable
                agents={agents}
                isLoading={isLoading}
                onEditAgent={handleEditAgent}
              />
            </div>
          )}
        </div>
      </div>

      <AgentFormModal
        isOpen={modalOpen}
        mode={modalMode}
        agent={selectedAgent}
        existingAgents={agents}
        onClose={handleCloseModal}
      />
    </>
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
