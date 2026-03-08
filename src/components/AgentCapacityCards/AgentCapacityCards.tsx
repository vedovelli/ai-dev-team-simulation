import type { AgentCapacityData } from '../../hooks/useBulkAssignment'

interface AgentCapacityCardsProps {
  capacityData: Record<string, AgentCapacityData>
  selectedAgentId?: string
  onSelectAgent?: (agentId: string) => void
  isLoading?: boolean
}

function getWorkloadColor(workload: AgentCapacityData['workload']): string {
  switch (workload) {
    case 'low':
      return 'bg-green-50 border-green-200'
    case 'medium':
      return 'bg-yellow-50 border-yellow-200'
    case 'high':
      return 'bg-orange-50 border-orange-200'
    case 'overloaded':
      return 'bg-red-50 border-red-200'
  }
}

function getProgressBarColor(workload: AgentCapacityData['workload']): string {
  switch (workload) {
    case 'low':
      return 'bg-green-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'high':
      return 'bg-orange-500'
    case 'overloaded':
      return 'bg-red-500'
  }
}

function getWorkloadLabel(workload: AgentCapacityData['workload']): string {
  switch (workload) {
    case 'low':
      return 'Available'
    case 'medium':
      return 'Moderate'
    case 'high':
      return 'Near Capacity'
    case 'overloaded':
      return 'Over Capacity'
  }
}

export function AgentCapacityCards({
  capacityData,
  selectedAgentId,
  onSelectAgent,
  isLoading = false,
}: AgentCapacityCardsProps) {
  const agents = Object.values(capacityData)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No agents available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const utilizationPercent = Math.round((agent.currentTasks / agent.maxTasks) * 100)
        const isSelected = selectedAgentId === agent.agentId

        return (
          <button
            key={agent.agentId}
            onClick={() => onSelectAgent?.(agent.agentId)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : `${getWorkloadColor(agent.workload)} border-opacity-50 hover:border-opacity-100`
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-900 truncate">{agent.name}</h3>
              <span className="text-xs font-medium px-2 py-1 rounded bg-slate-200 text-slate-700 flex-shrink-0 ml-2">
                {getWorkloadLabel(agent.workload)}
              </span>
            </div>

            {/* Task Count */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">
                  {agent.currentTasks} / {agent.maxTasks} tasks
                </span>
                <span className="text-xs text-slate-600">{utilizationPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressBarColor(agent.workload)}`}
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Capacity Status */}
            <div className="text-xs text-slate-600">
              {agent.workload === 'overloaded' ? (
                <p className="text-red-700 font-medium">⚠️ Over capacity</p>
              ) : (
                <p>{agent.maxTasks - agent.currentTasks} slot{agent.maxTasks - agent.currentTasks !== 1 ? 's' : ''} available</p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
