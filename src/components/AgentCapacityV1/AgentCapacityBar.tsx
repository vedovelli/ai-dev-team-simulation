/**
 * AgentCapacityBar Component
 *
 * Individual agent row showing capacity bar with status label.
 * Uses color coding: green (<60%), yellow (60-80%), red (>80%)
 *
 * Accessibility:
 * - ARIA labels for screen readers (aria-valuenow, aria-valuemin, aria-valuemax)
 * - Status communicated via text label + color (not color alone)
 * - Keyboard navigable with proper semantic HTML
 */

import type { AgentCapacityMetric } from '../../types/capacity'

interface AgentCapacityBarProps {
  agent: AgentCapacityMetric
}

/**
 * Get color classes based on capacity percentage
 * - Green: <60% (ok)
 * - Yellow: 60-80% (warning)
 * - Red: >80% (critical)
 */
function getCapacityColor(utilizationPct: number): {
  bar: string
  badge: string
  label: string
} {
  if (utilizationPct < 60) {
    return {
      bar: 'bg-green-500',
      badge: 'bg-green-100 text-green-800',
      label: 'Available',
    }
  } else if (utilizationPct <= 80) {
    return {
      bar: 'bg-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
      label: 'At Capacity',
    }
  } else {
    return {
      bar: 'bg-red-500',
      badge: 'bg-red-100 text-red-800',
      label: 'Over Capacity',
    }
  }
}

export function AgentCapacityBar({ agent }: AgentCapacityBarProps) {
  const colors = getCapacityColor(agent.utilizationPct)

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0 hover:bg-slate-50">
      {/* Agent Name */}
      <div className="min-w-0 flex-shrink-0">
        <p className="font-medium text-slate-900">{agent.name}</p>
        <p className="text-xs text-slate-500">{agent.agentId}</p>
      </div>

      {/* Capacity Bar with Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1">
            <div
              role="progressbar"
              aria-valuenow={agent.utilizationPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${agent.name} capacity: ${agent.utilizationPct}%`}
              className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className={`h-full transition-all ${colors.bar}`}
                style={{ width: `${Math.min(agent.utilizationPct, 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            {agent.utilizationPct}%
          </span>
        </div>

        {/* Capacity details */}
        <p className="text-xs text-slate-500">
          {agent.currentLoad} of {agent.maxCapacity} tasks
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${colors.badge}`}
        >
          {colors.label}
        </span>
      </div>
    </div>
  )
}
