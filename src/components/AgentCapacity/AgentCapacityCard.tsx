import { useState } from 'react'
import type { AgentCapacityMetrics } from '../../types/capacity'

interface AgentCapacityCardProps {
  agent: AgentCapacityMetrics
  isExpanded?: boolean
  onExpand?: (agentId: string) => void
  onAdjustClick?: (agentId: string) => void
}

function getWarningColor(warningLevel: string): string {
  switch (warningLevel) {
    case 'ok':
      return 'bg-green-50 border-green-200 hover:border-green-300'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
    case 'critical':
      return 'bg-red-50 border-red-200 hover:border-red-300'
    default:
      return 'bg-slate-50 border-slate-200'
  }
}

function getProgressBarColor(warningLevel: string): string {
  switch (warningLevel) {
    case 'ok':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'critical':
      return 'bg-red-600'
    default:
      return 'bg-slate-400'
  }
}

function getWarningBadgeColor(warningLevel: string): string {
  switch (warningLevel) {
    case 'ok':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

function getWarningLabel(warningLevel: string): string {
  switch (warningLevel) {
    case 'ok':
      return '✓ Available'
    case 'warning':
      return '⚠ Warning'
    case 'critical':
      return '🚨 Critical'
    default:
      return 'Unknown'
  }
}

export function AgentCapacityCard({
  agent,
  isExpanded = false,
  onExpand,
  onAdjustClick,
}: AgentCapacityCardProps) {
  const [localExpanded, setLocalExpanded] = useState(isExpanded)

  const handleToggleExpand = () => {
    setLocalExpanded(!localExpanded)
    onExpand?.(agent.agentId)
  }

  return (
    <div
      className={`rounded-lg border-2 transition-all duration-200 overflow-hidden ${getWarningColor(agent.warningLevel)}`}
    >
      {/* Compact View - Always Visible */}
      <button
        onClick={handleToggleExpand}
        className="w-full text-left p-4 hover:bg-opacity-50 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 truncate">{agent.name}</h3>
            <p className="text-xs text-slate-600 mt-1">{agent.agentId}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded border whitespace-nowrap ml-2 flex-shrink-0 ${getWarningBadgeColor(agent.warningLevel)}`}>
            {getWarningLabel(agent.warningLevel)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              {agent.tasksAssigned} / {agent.maxCapacity} tasks
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {agent.utilizationPct.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-slate-300 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressBarColor(agent.warningLevel)}`}
              style={{ width: `${Math.min(agent.utilizationPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Status */}
        <div className="text-xs text-slate-600">
          {agent.warningLevel === 'critical' ? (
            <p className="text-red-700 font-medium">Over capacity - action required</p>
          ) : agent.warningLevel === 'warning' ? (
            <p className="text-yellow-700 font-medium">Approaching capacity</p>
          ) : (
            <p>{Math.max(0, agent.maxCapacity - agent.tasksAssigned)} slot{agent.maxCapacity - agent.tasksAssigned !== 1 ? 's' : ''} available</p>
          )}
        </div>
      </button>

      {/* Expanded View */}
      {localExpanded && (
        <div className="border-t border-opacity-20 border-slate-400 px-4 py-4 bg-opacity-30">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-600 font-medium">Current Load</p>
                <p className="text-lg font-semibold text-slate-900">{agent.currentLoad}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Max Capacity</p>
                <p className="text-lg font-semibold text-slate-900">{agent.maxCapacity}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-600 font-medium mb-2">Utilization Trend</p>
              <div className="flex items-end gap-1 h-12">
                {[...Array(7)].map((_, i) => {
                  const randomHeight = Math.random() * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-slate-300 rounded-sm transition-colors hover:bg-slate-400"
                      style={{
                        height: `${randomHeight}%`,
                      }}
                    />
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => onAdjustClick?.(agent.agentId)}
              className="w-full mt-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Adjust Capacity
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
