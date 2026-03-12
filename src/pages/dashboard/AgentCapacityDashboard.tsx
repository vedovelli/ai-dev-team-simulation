import { useCallback, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAgentCapacityMetrics } from '../../hooks/queries/capacity'
import { useCapacityAdjustment } from '../../hooks/mutations/useCapacityAdjustment'
import type { AgentCapacityMetric } from '../../types/capacity'

interface AgentCapacityDashboardProps {
  sprintId: string
}

export function AgentCapacityDashboard({
  sprintId,
}: AgentCapacityDashboardProps) {
  // Fetch capacity metrics
  const { data, isLoading, error } = useAgentCapacityMetrics(sprintId)
  const { mutate: adjustCapacity } = useCapacityAdjustment(sprintId)

  const agents = useMemo(() => data?.agents ?? [], [data?.agents])

  // Virtual scrolling for agent lists > 20
  const containerRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: agents.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80, // Approximate height of each row
    overscan: 10, // Render 10 items outside visible area
  })

  const virtualItems = virtualizer.getVirtualItems()

  const handleCapacityChange = useCallback(
    (agentId: string, newCapacity: number) => {
      adjustCapacity({ agentId, newMaxCapacity: newCapacity })
    },
    [adjustCapacity]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-400">Loading agent capacity metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">
          Failed to load capacity metrics: {error.message}
        </p>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-slate-500">No agents found for this sprint</p>
      </div>
    )
  }

  // Calculate summary metrics
  const totalUtilization = agents.reduce(
    (sum, a) => sum + a.utilizationPct,
    0
  )
  const avgUtilization = Math.round(totalUtilization / agents.length)
  const criticalCount = agents.filter(
    (a) => a.warningLevel === 'critical'
  ).length
  const warningCount = agents.filter(
    (a) => a.warningLevel === 'warning'
  ).length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Total Agents</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {agents.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">
            Avg Utilization
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {avgUtilization}%
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-700">Warnings</p>
          <p className="mt-1 text-2xl font-bold text-yellow-900">
            {warningCount}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Critical</p>
          <p className="mt-1 text-2xl font-bold text-red-900">
            {criticalCount}
          </p>
        </div>
      </div>

      {/* Agent List with Virtual Scrolling */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Agent Capacity</h3>
          <p className="text-sm text-slate-500">
            Utilization levels across {agents.length} agents
          </p>
        </div>

        {agents.length > 20 ? (
          // Virtual scrolling for large lists
          <div
            ref={containerRef}
            className="relative h-96 overflow-y-auto"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
              }}
            >
              {virtualItems.map((virtualItem) => {
                const agent = agents[virtualItem.index] as AgentCapacityMetric
                return (
                  <AgentCapacityRow
                    key={agent.agentId}
                    agent={agent}
                    onCapacityChange={handleCapacityChange}
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          // Regular list for small agent counts
          <div className="divide-y divide-slate-200">
            {agents.map((agent) => (
              <AgentCapacityRow
                key={agent.agentId}
                agent={agent}
                onCapacityChange={handleCapacityChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      <p className="text-xs text-slate-500">
        Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'unknown'}
      </p>
    </div>
  )
}

interface AgentCapacityRowProps {
  agent: AgentCapacityMetric
  onCapacityChange: (agentId: string, newCapacity: number) => void
  style?: React.CSSProperties
}

function AgentCapacityRow({
  agent,
  onCapacityChange,
  style,
}: AgentCapacityRowProps) {
  const getWarningColor = (level: string) => {
    switch (level) {
      case 'ok':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'ok':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-slate-500'
    }
  }

  const handleIncrement = () => {
    onCapacityChange(agent.agentId, agent.maxCapacity + 1)
  }

  const handleDecrement = () => {
    if (agent.maxCapacity > 1) {
      onCapacityChange(agent.agentId, agent.maxCapacity - 1)
    }
  }

  return (
    <div
      style={style}
      className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50"
    >
      {/* Agent Name */}
      <div className="flex-shrink-0">
        <p className="font-medium text-slate-900">{agent.name}</p>
        <p className="text-xs text-slate-500">{agent.agentId}</p>
      </div>

      {/* Progress Bar */}
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all ${getProgressColor(agent.warningLevel)}`}
                style={{ width: `${Math.min(agent.utilizationPct, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-slate-700">
            {agent.utilizationPct}%
          </span>
        </div>
      </div>

      {/* Load Info */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-slate-900">
          {agent.currentLoad} / {agent.maxCapacity}
        </p>
        <p className="text-xs text-slate-500">tasks</p>
      </div>

      {/* Capacity Adjustment */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={handleDecrement}
          disabled={agent.maxCapacity <= 1}
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Decrease capacity"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-medium">
          {agent.maxCapacity}
        </span>
        <button
          onClick={handleIncrement}
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-200 hover:bg-slate-100"
          aria-label="Increase capacity"
        >
          +
        </button>
      </div>

      {/* Warning Badge */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getWarningColor(agent.warningLevel)}`}
        >
          {agent.warningLevel}
        </span>
      </div>
    </div>
  )
}

// Import React for ref
import React from 'react'
