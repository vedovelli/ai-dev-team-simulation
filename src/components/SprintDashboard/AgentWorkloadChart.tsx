import type { WorkloadData } from '../../hooks/useAgentWorkload'

export interface AgentWorkloadChartProps {
  workloadData: WorkloadData[]
  isLoading?: boolean
  hasError?: boolean
  selectedAgentId?: string | null
  onAgentSelect?: (agentId: string | null) => void
}

/**
 * Agent Workload Chart - displays workload distribution across agents
 * Shows utilization percentage with color coding
 */
export function AgentWorkloadChart({
  workloadData,
  isLoading,
  hasError,
  selectedAgentId,
  onAgentSelect,
}: AgentWorkloadChartProps) {
  if (hasError) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Agent Workload Distribution</h3>
        <div className="bg-red-900/20 border border-red-700 rounded p-4 text-red-300">
          Failed to load agent workload data
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Agent Workload Distribution</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/4 mb-2" />
              <div className="h-2 bg-slate-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-600'
    if (percent >= 70) return 'bg-yellow-600'
    if (percent >= 50) return 'bg-blue-600'
    return 'bg-green-600'
  }

  const getUtilizationLabel = (percent: number) => {
    if (percent >= 90) return 'Overloaded'
    if (percent >= 70) return 'High'
    if (percent >= 50) return 'Balanced'
    return 'Underutilized'
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4">Agent Workload Distribution</h3>

      <div className="space-y-4">
        {workloadData.map((agent) => (
          <div key={agent.agentId} className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onAgentSelect?.(selectedAgentId === agent.agentId ? null : agent.agentId)}
                className={`font-medium text-sm px-3 py-1 rounded cursor-pointer transition-colors ${
                  selectedAgentId === agent.agentId
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                {agent.agentId}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{agent.activeTasksCount} active</span>
                <span className="text-sm font-semibold text-slate-200">{agent.utilizationPercent}%</span>
              </div>
            </div>

            {/* Utilization bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getUtilizationColor(agent.utilizationPercent)}`}
                  style={{ width: `${Math.min(agent.utilizationPercent, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={agent.utilizationPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${agent.agentId} utilization`}
                />
              </div>
              <span className="text-xs text-slate-400 min-w-fit">{getUtilizationLabel(agent.utilizationPercent)}</span>
            </div>

            {/* Details */}
            <div className="text-xs text-slate-500 flex gap-4">
              <span>Hours: {agent.totalEstimatedHours} / {agent.sprintCapacity}</span>
              <span>Role: {agent.role}</span>
            </div>
          </div>
        ))}
      </div>

      {workloadData.length === 0 && (
        <div className="text-slate-400 text-center py-8">
          <p>No agents assigned to this sprint</p>
        </div>
      )}
    </div>
  )
}
