import type { AgentStatus } from '../../types/agent'

interface AgentStatusBadgeProps {
  status: AgentStatus
}

export function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const statusConfig: Record<
    AgentStatus,
    {
      label: string
      bgColor: string
      textColor: string
    }
  > = {
    idle: {
      label: 'Idle',
      bgColor: 'bg-gray-700',
      textColor: 'text-gray-300',
    },
    active: {
      label: 'Active',
      bgColor: 'bg-green-900',
      textColor: 'text-green-300',
    },
    working: {
      label: 'Working',
      bgColor: 'bg-blue-900',
      textColor: 'text-blue-300',
    },
    busy: {
      label: 'Busy',
      bgColor: 'bg-yellow-900',
      textColor: 'text-yellow-300',
    },
    blocked: {
      label: 'Blocked',
      bgColor: 'bg-red-900',
      textColor: 'text-red-300',
    },
    offline: {
      label: 'Offline',
      bgColor: 'bg-red-950',
      textColor: 'text-red-400',
    },
    completed: {
      label: 'Completed',
      bgColor: 'bg-green-800',
      textColor: 'text-green-200',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  )
}
