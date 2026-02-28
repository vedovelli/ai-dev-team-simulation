import type { AgentStatus } from '../types/agent'

interface StatusBadgeProps {
  status: AgentStatus
}

function getStatusIcon(status: AgentStatus): string {
  switch (status) {
    case 'idle':
      return '○'
    case 'working':
      return '⟳'
    case 'blocked':
      return '⚠'
    case 'completed':
      return '✓'
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-slate-100 text-slate-700'
      case 'working':
        return 'bg-blue-100 text-blue-700'
      case 'blocked':
        return 'bg-amber-100 text-amber-700'
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusColor(status)}`}
    >
      <span className="text-base">{getStatusIcon(status)}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
