import type { Agent } from '../../types/agent'

interface AgentWorkloadCardProps {
  agent: Agent
  totalTasks: number
  inProgressTasks: number
}

export function AgentWorkloadCard({
  agent,
  totalTasks,
  inProgressTasks,
}: AgentWorkloadCardProps) {
  const progressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{agent.name}</p>
          <p className="text-xs text-gray-500">{agent.role}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{totalTasks}</p>
          <p className="text-xs text-gray-500">tasks</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>In Progress</span>
          <span>{inProgressTasks}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
