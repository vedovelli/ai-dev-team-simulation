import type { AgentAvailabilityStatus } from '@/types/agent'

export interface AgentStatusBadgeProps {
  status: AgentAvailabilityStatus
  className?: string
}

function getStatusStyles(status: AgentAvailabilityStatus) {
  switch (status) {
    case 'idle':
      return 'bg-gray-100 text-gray-800'
    case 'active':
      return 'bg-blue-100 text-blue-800'
    case 'busy':
      return 'bg-yellow-100 text-yellow-800'
    case 'offline':
      return 'bg-gray-200 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: AgentAvailabilityStatus) {
  switch (status) {
    case 'idle':
      return 'Idle'
    case 'active':
      return 'Working'
    case 'busy':
      return 'Waiting'
    case 'offline':
      return 'Offline'
    default:
      return status
  }
}

export function AgentStatusBadge({
  status,
  className = '',
}: AgentStatusBadgeProps) {
  const isWorking = status === 'active'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative inline-block">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(status)}`}
        >
          {getStatusLabel(status)}
        </span>
        {isWorking && (
          <span className="absolute inset-0 rounded-full animate-pulse bg-blue-400 opacity-20" />
        )}
      </div>
    </div>
  )
}
