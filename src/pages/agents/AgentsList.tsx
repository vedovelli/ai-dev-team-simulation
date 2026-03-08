import { useMemo, useRef, useEffect } from 'react'
import { useAgents } from '../../hooks/useAgents'
import { useFilters, type FilterState } from '../../hooks/useFilters'
import { FilterBar, type FilterBarConfig } from '../../components/FilterBar'
import { useFilterContext } from '../../components/FilterProvider'

interface AgentFilterState extends FilterState {
  search?: string
  status?: 'active' | 'idle' | 'busy' | 'offline'
  sortBy?: 'name' | 'status' | 'taskCount' | 'successRate' | 'createdAt' | 'updatedAt'
  order?: 'asc' | 'desc'
}

/**
 * Advanced agents list with filtering and search
 *
 * Features:
 * - Real-time search with 300ms debouncing
 * - Status filtering
 * - URL-based filter persistence
 * - Composable filter predicates
 */
export function AgentsList() {
  // Get filter state from URL
  const { filters, search, rawSearch, setSearch, setFilter, setFilters, clearFilters, hasActiveFilters } =
    useFilters<AgentFilterState>({
      debounceMs: 300,
    })

  // Fetch agents with filter support
  const { data: agents = [], isLoading, error } = useAgents({
    search: filters.search as string | undefined,
    status: filters.status as any,
    sortBy: filters.sortBy as any,
    order: filters.order as any,
  })

  // Track if data is stale (search changed but agents data hasn't updated yet)
  const prevFiltersRef = useRef({ search: filters.search, status: filters.status })
  const isStale = useMemo(() => {
    const searchChanged = prevFiltersRef.current.search !== filters.search
    const statusChanged = prevFiltersRef.current.status !== filters.status
    return (searchChanged || statusChanged) && isLoading
  }, [filters.search, filters.status, isLoading])

  // Update ref when data loads
  useEffect(() => {
    if (!isLoading) {
      prevFiltersRef.current = { search: filters.search, status: filters.status }
    }
  }, [isLoading, filters.search, filters.status])

  // Get filter context for client-side filtering
  const { applyFilters, createPredicate } = useFilterContext()

  // Apply client-side filters
  const filteredAgents = useMemo(() => {
    if (!agents.length) return []

    const predicates = []

    // Search filter (name or capabilities)
    if (search) {
      predicates.push(
        createPredicate<string>('name', 'contains', search)
      )
    }

    // Status filter
    if (filters.status) {
      predicates.push(
        createPredicate<string>('status', 'equals', filters.status as string)
      )
    }

    // Note: In production, prefer server-side filtering via MSW handlers
    // This demonstrates client-side filtering capability
    return applyFilters(agents, predicates)
  }, [agents, search, filters.status, applyFilters, createPredicate])

  // Filter configuration
  const filterConfig: FilterBarConfig[] = [
    {
      label: 'Status',
      key: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Idle', value: 'idle' },
        { label: 'Busy', value: 'busy' },
        { label: 'Offline', value: 'offline' },
      ],
    },
    {
      label: 'Search',
      key: 'search',
      type: 'search',
      placeholder: 'Search by name or capability...',
    },
  ]

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-8 text-red-600">
        Error loading agents: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
        <p className="text-gray-600 mt-2">Manage and view all agents in the system</p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        rawSearch={rawSearch}
        config={filterConfig}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results */}
      <div className="space-y-4">
        {isLoading || isStale ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <p className="text-gray-600">
              {hasActiveFilters ? 'No agents match your filters.' : 'No agents found.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg text-gray-900">{agent.name}</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Status:</span>{' '}
                    <span
                      className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                        agent.status === 'active'
                          ? 'bg-green-500'
                          : agent.status === 'busy'
                            ? 'bg-yellow-500'
                            : agent.status === 'offline'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Tasks:</span> {agent.taskCount}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Success Rate:</span> {agent.successRate.toFixed(1)}%
                  </p>
                  <div className="mt-2">
                    <p className="font-medium text-gray-700 text-xs mb-1">Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map((cap) => (
                        <span key={cap} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {cap}
                        </span>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <span className="px-2 py-1 text-gray-600 text-xs">+{agent.capabilities.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredAgents.length > 0 && (
          <div className="text-sm text-gray-500 text-center pt-4">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        )}
      </div>
    </div>
  )
}
