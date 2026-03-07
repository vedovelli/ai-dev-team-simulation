import type { AgentAvailabilityStatus } from '../../types/agent'

interface AgentStatusIndicatorProps {
  status: AgentAvailabilityStatus
  isUpdating?: boolean
}

/**
 * Agent Status Indicator badge component
 * Shows real-time status with color-coded indicator
 */
export function AgentStatusIndicator({ status, isUpdating }: AgentStatusIndicatorProps) {
  const statusConfig: Record<
    AgentAvailabilityStatus,
    {
      label: string
      bgColor: string
      dotColor: string
      textColor: string
    }
  > = {
    idle: {
      label: 'Idle',
      bgColor: 'bg-slate-700/50',
      dotColor: 'bg-slate-400',
      textColor: 'text-slate-300',
    },
    active: {
      label: 'Active',
      bgColor: 'bg-blue-900/50',
      dotColor: 'bg-blue-400',
      textColor: 'text-blue-300',
    },
    busy: {
      label: 'Busy',
      bgColor: 'bg-yellow-900/50',
      dotColor: 'bg-yellow-400',
      textColor: 'text-yellow-300',
    },
    offline: {
      label: 'Offline',
      bgColor: 'bg-red-900/50',
      dotColor: 'bg-red-400',
      textColor: 'text-red-300',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bgColor} border border-slate-600 rounded-full px-4 py-2 flex items-center gap-2`}>
      <div
        className={`w-3 h-3 rounded-full ${config.dotColor} ${isUpdating ? 'animate-pulse' : ''}`}
      />
      <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
    </div>
  )
}
