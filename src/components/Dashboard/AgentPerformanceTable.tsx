import React from 'react'
import { useTable } from '../../hooks/useTable'
import type { AgentMetrics } from '../../types/metrics'

interface AgentPerformanceTableProps {
  data: AgentMetrics[]
  isLoading?: boolean
}

const PERFORMANCE_TIERS = ['excellent', 'good', 'average', 'below-average'] as const

export function AgentPerformanceTable({ data, isLoading }: AgentPerformanceTableProps) {
  const { sortedAndFilteredData, handleSort, handleFilter, sortKey, sortOrder, filterValue } =
    useTable({
      data,
      initialSortKey: 'completedTasks',
      initialSortOrder: 'desc',
    })

  const performanceBadgeClass = (tier: string) => {
    // Runtime validation: ensure tier is a valid performance tier
    if (!PERFORMANCE_TIERS.includes(tier as typeof PERFORMANCE_TIERS[number])) {
      console.warn(`Unexpected performance tier from API: "${tier}". Falling back to default styling.`)
      return 'bg-slate-900/40 text-slate-300 border border-slate-700'
    }

    switch (tier) {
      case 'excellent':
        return 'bg-green-900/40 text-green-300 border border-green-700'
      case 'good':
        return 'bg-blue-900/40 text-blue-300 border border-blue-700'
      case 'average':
        return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
      case 'below-average':
        return 'bg-red-900/40 text-red-300 border border-red-700'
      default:
        return 'bg-slate-900/40 text-slate-300 border border-slate-700'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-700/30 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100">Agent Performance</h2>
        <input
          type="text"
          placeholder="Search agents..."
          value={filterValue}
          onChange={(e) => handleFilter(e.target.value)}
          className="px-3 py-2 rounded bg-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                onClick={() => handleSort('agentName')}
              >
                Agent Name {sortKey === 'agentName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                onClick={() => handleSort('completedTasks')}
              >
                Tasks Completed {sortKey === 'completedTasks' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                onClick={() => handleSort('successRate')}
              >
                Success Rate {sortKey === 'successRate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
                onClick={() => handleSort('averageTimeToComplete')}
              >
                Avg Time (min) {sortKey === 'averageTimeToComplete' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                Performance Tier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedAndFilteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No agents found
                </td>
              </tr>
            ) : (
              sortedAndFilteredData.map((agent) => (
                <tr key={agent.agentId} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 text-sm text-slate-200">{agent.agentName}</td>
                  <td className="px-6 py-3 text-sm text-slate-200">{agent.completedTasks}</td>
                  <td className="px-6 py-3 text-sm text-slate-200">{agent.successRate}%</td>
                  <td className="px-6 py-3 text-sm text-slate-200">{agent.averageTimeToComplete}</td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-medium ${performanceBadgeClass(agent.performanceTier)}`}
                    >
                      {agent.performanceTier}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
