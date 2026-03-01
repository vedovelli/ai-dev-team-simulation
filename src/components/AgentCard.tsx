import { Link } from '@tanstack/react-router'
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
    <Link to={`/agents/${agent.id}`}>
      <article
        className={`p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200 cursor-pointer ${getRoleBgColor(agent.role)} group`}
      >
      {/* Header with name and status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4">
        <div className="flex-1 min-w-0 mb-3 sm:mb-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-slate-700 transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{getRoleLabel(agent.role)}</p>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={agent.status} />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200 mb-4" />

      {/* Current task */}
      {agent.currentTask && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Activity
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
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between text-xs text-slate-500 pt-3 border-t border-slate-200 gap-2">
        <p className="truncate">ID: {agent.id.substring(0, 8)}...</p>
        <p className="flex-shrink-0">{new Date(agent.lastUpdated).toLocaleTimeString()}</p>
      </div>
      </article>
    </Link>
  )
}
