import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSearch } from '@tanstack/react-router'
import { useAgents } from '../../hooks/useAgents'
import { AgentCard } from '../../components/AgentCard'
import { RouteErrorBoundary } from '../../components/RouteErrorBoundary'
import { Suspense, useMemo } from 'react'
import { AgentsSearchParamSchema, serializeAgentsSearchParams, deserializeAgentsSearchParams } from '../../lib/router-types'

/* eslint-disable react-refresh/only-export-components */

// Pre-fetch agents data when route loader runs
async function loadAgents() {
  // The query client is available in Route.useRouteContext()
  // Data will be loaded via the query hook below
  return null
}

function AgentsDashboard() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/agents/' })
  const { data: response, isLoading, error } = useAgents()
  const agents = response?.data ?? []

  // Validate and deserialize search params
  const validatedParams = useMemo(() => {
    try {
      return deserializeAgentsSearchParams(searchParams)
    } catch {
      return {}
    }
  }, [searchParams])

  // Filter agents based on search params
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (validatedParams.filter) {
        const filterLower = validatedParams.filter.toLowerCase()
        return (
          agent.name.toLowerCase().includes(filterLower) ||
          agent.role?.toLowerCase().includes(filterLower) ||
          agent.status?.toLowerCase().includes(filterLower)
        )
      }
      return true
    }).sort((a, b) => {
      const sortField = validatedParams.sort || 'name'
      const isDesc = validatedParams.sortOrder === 'desc'

      let aValue: string | undefined
      let bValue: string | undefined

      if (sortField === 'name') {
        aValue = a.name
        bValue = b.name
      } else if (sortField === 'status') {
        aValue = a.status
        bValue = b.status
      } else if (sortField === 'role') {
        aValue = a.role
        bValue = b.role
      }

      if (!aValue || !bValue) return 0
      const comparison = aValue.localeCompare(bValue)
      return isDesc ? -comparison : comparison
    })
  }, [agents, validatedParams])

  const handleFilterChange = (filter: string) => {
    navigate({
      to: '/agents/',
      search: serializeAgentsSearchParams({ ...validatedParams, filter: filter || undefined }),
    })
  }

  const handleSortChange = (sort: 'name' | 'status' | 'role') => {
    navigate({
      to: '/agents/',
      search: serializeAgentsSearchParams({ ...validatedParams, sort }),
    })
  }

  const handleSortOrderChange = (sortOrder: 'asc' | 'desc') => {
    navigate({
      to: '/agents/',
      search: serializeAgentsSearchParams({ ...validatedParams, sortOrder }),
    })
  }

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
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Agent Dashboard</h1>
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

        <div className="mb-6 space-y-4 p-4 bg-slate-800 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Filter</label>
            <input
              type="text"
              value={validatedParams.filter || ''}
              onChange={(e) => handleFilterChange(e.target.value)}
              placeholder="Search by name, role, or status..."
              className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
              <select
                value={validatedParams.sort || 'name'}
                onChange={(e) => handleSortChange(e.target.value as 'name' | 'status' | 'role')}
                className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="role">Role</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Order</label>
              <select
                value={validatedParams.sortOrder || 'asc'}
                onChange={(e) => handleSortOrderChange(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No agents match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
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
  validateSearch: (search) => AgentsSearchParamSchema.parse(search),
})
