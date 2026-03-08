import { useMemo } from 'react'
import type { Agent, AgentStatus } from '../../types/agent'
import { useTableState } from '../../hooks/useTableState'
import { SearchBar } from './SearchBar'
import { FilterControls, type FilterOption } from './FilterControls'
import { Pagination } from './Pagination'

const STATUS_COLORS: Record<AgentStatus, string> = {
  'idle': 'bg-green-500/20 text-green-300',
  'working': 'bg-blue-500/20 text-blue-300',
  'blocked': 'bg-red-500/20 text-red-300',
  'completed': 'bg-slate-500/20 text-slate-300',
}

export interface AgentsTableProps {
  agents: Agent[]
  isLoading?: boolean
}

/**
 * Refactored AgentsTable with URL-driven state via useTableState.
 * Features:
 * - Search by agent name
 * - Filter by status (idle/working/blocked/completed)
 * - Sort by name, status, last updated
 * - Pagination with configurable page size
 * - Full browser back/forward support
 */
export function AgentsTable({ agents, isLoading = false }: AgentsTableProps) {
  const tableState = useTableState({
    page: 1,
    pageSize: 10,
  })

  // Compute filter options
  const statusOptions = useMemo<FilterOption[]>(() => [
    { value: 'idle', label: 'Idle' },
    { value: 'working', label: 'Working' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'completed', label: 'Completed' },
  ], [])

  // Apply filtering and sorting
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents]

    // Apply status filter
    const statusFilter = tableState.state.filters?.status
    if (statusFilter) {
      result = result.filter((agent) => agent.status === statusFilter)
    }

    // Apply search across name
    const searchQuery = tableState.state.filters?.search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((agent) => agent.name.toLowerCase().includes(query))
    }

    // Apply sorting
    if (tableState.sorting.length > 0) {
      const sort = tableState.sorting[0]
      result.sort((a, b) => {
        let aVal: any = a[sort.id as keyof Agent]
        let bVal: any = b[sort.id as keyof Agent]

        // Handle undefined/null values
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sort.desc ? -1 : 1
        if (bVal == null) return sort.desc ? 1 : -1

        // Handle string comparison
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal)
          return sort.desc ? -comparison : comparison
        }

        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.desc ? bVal - aVal : aVal - bVal
        }

        // Fallback
        if (aVal < bVal) return sort.desc ? 1 : -1
        if (aVal > bVal) return sort.desc ? -1 : 1
        return 0
      })
    }

    return result
  }, [agents, tableState.state.filters, tableState.sorting])

  // Apply pagination
  const paginatedAgents = useMemo(() => {
    const start = (tableState.page - 1) * tableState.pageSize
    const end = start + tableState.pageSize
    return filteredAndSortedAgents.slice(start, end)
  }, [filteredAndSortedAgents, tableState.page, tableState.pageSize])

  const handleSearchChange = (value: string) => {
    tableState.setColumnFilters([
      {
        id: 'search',
        value,
      },
    ])
  }

  const handleStatusFilterChange = (key: string, value: string | undefined) => {
    tableState.setColumnFilters([
      {
        id: 'status',
        value: value || '',
      },
    ])
  }

  const handleSort = (columnId: string) => {
    tableState.setSorting((prev) => {
      const existing = prev.find((s) => s.id === columnId)
      if (existing) {
        return [{ id: columnId, desc: !existing.desc }]
      }
      return [{ id: columnId, desc: false }]
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 h-12 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No agents available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <SearchBar
          value={tableState.state.filters?.search ?? ''}
          onChange={handleSearchChange}
          placeholder="Search agents by name..."
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <FilterControls
            filters={tableState.state.filters ?? {}}
            onFilterChange={(key, value) => {
              if (key === 'status') handleStatusFilterChange(key, value)
            }}
            filterConfigs={[{ key: 'status', label: 'Status', options: statusOptions }]}
          />

          {tableState.hasActiveFilters && (
            <button
              onClick={tableState.clearFilters}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredAndSortedAgents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No agents match the current filters</p>
        </div>
      ) : (
        <>
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      Name
                      {tableState.sorting[0]?.id === 'name' &&
                        (tableState.sorting[0]?.desc ? ' ↓' : ' ↑')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('role')}
                      className="text-slate-300 hover:text-white font-medium"
                    >
                      Role
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="text-slate-300 hover:text-white font-medium"
                    >
                      Status
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('currentTask')}
                      className="text-slate-300 hover:text-white font-medium"
                    >
                      Current Task
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('lastUpdated')}
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      Last Updated
                      {tableState.sorting[0]?.id === 'lastUpdated' &&
                        (tableState.sorting[0]?.desc ? ' ↓' : ' ↑')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{agent.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs">
                        {agent.role === 'sr-dev'
                          ? 'Senior Dev'
                          : agent.role === 'junior'
                            ? 'Junior Dev'
                            : agent.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[agent.status]}`}
                      >
                        {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs truncate max-w-xs">
                        {agent.currentTask || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs">
                        {new Date(agent.lastUpdated).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            page={tableState.page}
            pageSize={tableState.pageSize}
            totalItems={filteredAndSortedAgents.length}
            onPageChange={tableState.setPage}
            onPageSizeChange={tableState.setPageSize}
          />
        </>
      )}
    </div>
  )
}
