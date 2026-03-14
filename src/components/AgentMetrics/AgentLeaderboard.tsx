import { useNavigate } from '@tanstack/react-router'
import { useTable } from '../../hooks/useTable'
import { useAgentAvailability } from '../../hooks/useAgentAvailability'
import { AgentStatusBadge } from '../AgentStatusBadge/AgentStatusBadge'
import type { AgentMetrics } from '../../types/metrics'

interface AgentLeaderboardProps {
  metrics: AgentMetrics[]
  isLoading?: boolean
  error?: Error | null
  onRowClick?: (agentId: string) => void
}

export function AgentLeaderboard({
  metrics,
  isLoading = false,
  error = null,
  onRowClick,
}: AgentLeaderboardProps) {
  const navigate = useNavigate()
  const { agents: availabilityData } = useAgentAvailability()
  const { sortedAndFilteredData, sortKey, sortOrder, filterValue, handleSort, handleFilter } =
    useTable<AgentMetrics>({
      data: metrics,
      initialSortKey: 'completionRate',
      initialSortOrder: 'desc',
    })

  const handleRowClick = (agentId: string) => {
    if (onRowClick) {
      onRowClick(agentId)
    } else {
      navigate({ to: `/agents/$id`, params: { id: agentId } })
    }
  }

  const columns: {
    key: keyof AgentMetrics | 'availability'
    label: string
    sortable: boolean
    format?: (value: any) => string
  }[] = [
    { key: 'agentName', label: 'Agent Name', sortable: true },
    { key: 'agentRole', label: 'Role', sortable: true },
    { key: 'availability', label: 'Status', sortable: false },
    {
      key: 'completedTasks',
      label: 'Tasks Completed',
      sortable: true,
      format: (v) => v.toString(),
    },
    {
      key: 'completionRate',
      label: 'Success Rate',
      sortable: true,
      format: (v) => `${v}%`,
    },
    {
      key: 'averageTimeToComplete',
      label: 'Avg Response Time (min)',
      sortable: true,
      format: (v) => v.toString(),
    },
    {
      key: 'performanceTier',
      label: 'Performance Tier',
      sortable: true,
    },
  ]

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading metrics: {error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading agent metrics...</p>
      </div>
    )
  }

  if (sortedAndFilteredData.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">
          {filterValue ? 'No agents match your search' : 'No agent metrics available'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search agents by name or role..."
          value={filterValue}
          onChange={(e) => handleFilter(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-6 py-3 text-left text-sm font-semibold text-slate-700 ${
                    col.sortable ? 'cursor-pointer hover:bg-slate-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && sortKey === col.key && (
                      <span className="text-xs text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredData.map((metric, index) => (
              <tr
                key={metric.agentId}
                onClick={() => handleRowClick(metric.agentId)}
                className="border-b border-slate-200 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                  {index + 1}. {metric.agentName}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{metric.agentRole}</td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const agent = availabilityData.find((a) => a.id === metric.agentId)
                    return agent ? (
                      <AgentStatusBadge status={agent.status} />
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{metric.completedTasks}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      metric.completionRate >= 90
                        ? 'bg-green-100 text-green-800'
                        : metric.completionRate >= 75
                          ? 'bg-blue-100 text-blue-800'
                          : metric.completionRate >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metric.completionRate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{metric.averageTimeToComplete}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                      metric.performanceTier === 'excellent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : metric.performanceTier === 'good'
                          ? 'bg-cyan-100 text-cyan-800'
                          : metric.performanceTier === 'average'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metric.performanceTier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-slate-500 text-center mt-4">
        Showing {sortedAndFilteredData.length} of {metrics.length} agents
      </div>
    </div>
  )
}
