import type { AgentStatus } from '../types/agent'

interface AgentStatusIndicatorProps {
  status: AgentStatus
}

export function AgentStatusIndicator({ status }: AgentStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      bgColor: 'bg-green-500',
      label: 'Idle',
      textColor: 'text-green-700',
    },
    working: {
      bgColor: 'bg-yellow-500',
      label: 'Working',
      textColor: 'text-yellow-700',
    },
    blocked: {
      bgColor: 'bg-red-500',
      label: 'Blocked',
      textColor: 'text-red-700',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}
