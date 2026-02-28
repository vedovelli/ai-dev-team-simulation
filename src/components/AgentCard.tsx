import type { Agent } from '../types/agent'
import { StatusBadge } from './StatusBadge'

interface AgentCardProps {
  agent: Agent
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'sr-dev': 'Senior Dev',
    'junior': 'Junior Dev',
    'pm': 'Project Manager',
  }
  return labels[role] || role
}

function getRoleBgColor(role: string): string {
  switch (role) {
    case 'sr-dev':
      return 'bg-purple-50'
    case 'junior':
      return 'bg-sky-50'
    case 'pm':
      return 'bg-orange-50'
    default:
      return 'bg-slate-50'
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className={`p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${getRoleBgColor(agent.role)}`}>
      {/* Header with name and status */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 truncate">{agent.name}</h3>
          <p className="text-sm text-slate-600 mt-1">{getRoleLabel(agent.role)}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200 mb-4" />

      {/* Current task */}
      {agent.currentTask && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Current Activity
          </p>
          <p className="text-sm text-slate-700 line-clamp-2">{agent.currentTask}</p>
        </div>
      )}

      {/* Output/Progress */}
      {agent.output && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Output
          </p>
          <p className="text-sm text-slate-600 line-clamp-2">{agent.output}</p>
        </div>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200">
        <p>ID: {agent.id.substring(0, 8)}...</p>
        <p>{new Date(agent.lastUpdated).toLocaleTimeString()}</p>
      </div>
    </div>
  )
}
