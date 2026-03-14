/**
 * AgentCapacityDashboardV1 Component
 *
 * Simplified management-facing dashboard showing agent workload and capacity warnings.
 * Provides quick overview of team capacity without operational complexity.
 *
 * Features:
 * - Agent list with capacity bars (% of 10-task limit)
 * - Color status: green (<60%), yellow (60–80%), red (>80%)
 * - Text labels alongside colors (accessibility — not color-only)
 * - Summary badge: "X agents over 80% capacity"
 * - 60s polling via TanStack Query
 * - Full ARIA accessibility on progress bars
 */

import { useMemo } from 'react'
import { useAgentCapacityMetricsV1 } from '../../hooks/useAgentCapacityMetricsV1'
import { AgentCapacityBar } from './AgentCapacityBar'
import { CapacityAlertBadge } from './CapacityAlertBadge'

export function AgentCapacityDashboardV1() {
  const { data, isLoading, error } = useAgentCapacityMetricsV1()

  const agents = useMemo(() => data?.agents ?? [], [data?.agents])

  // Calculate summary metrics
  const overCapacityCount = useMemo(
    () => agents.filter((a) => a.utilizationPct > 80).length,
    [agents]
  )

  const avgCapacity = useMemo(() => {
    if (agents.length === 0) return 0
    return Math.round(
      agents.reduce((sum, a) => sum + a.utilizationPct, 0) / agents.length
    )
  }, [agents])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-12">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
          <p className="text-sm text-slate-600">Loading agent capacity...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-900">
          Failed to load capacity dashboard
        </p>
        <p className="mt-1 text-xs text-red-700">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">No agents found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Badge */}
      <CapacityAlertBadge
        overCapacityCount={overCapacityCount}
        totalAgents={agents.length}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Total Agents</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {agents.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">
            Average Capacity
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {avgCapacity}%
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">
            Over Capacity
          </p>
          <p className="mt-2 text-2xl font-bold text-red-900">
            {overCapacityCount}
          </p>
        </div>
      </div>

      {/* Agent List */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Agent Capacity</h3>
          <p className="text-sm text-slate-500">
            Workload distribution across {agents.length} agents
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {agents.map((agent) => (
            <AgentCapacityBar key={agent.agentId} agent={agent} />
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-slate-500">
        Last updated:{' '}
        {data?.timestamp
          ? new Date(data.timestamp).toLocaleTimeString()
          : 'unknown'}
        {' • '}
        Updates every 60 seconds
      </p>
    </div>
  )
}
