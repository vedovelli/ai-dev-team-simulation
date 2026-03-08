import { useAgentStatus } from '../../hooks/useAgentStatus'
import type { AgentAvailability } from '../../types/agent'
import { AgentStatusSkeletons } from './AgentStatusSkeletons'
import { AgentStatusIndicator } from './AgentStatusIndicator'

type AgentStatus = 'idle' | 'active' | 'busy' | 'offline'

interface StatusColors {
  card: string
  dot: string
}

const STATUS_COLORS: Record<AgentStatus | 'default', StatusColors> = {
  idle: {
    card: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
  active: {
    card: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200',
    dot: 'bg-blue-500',
  },
  busy: {
    card: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200',
    dot: 'bg-yellow-500',
  },
  offline: {
    card: 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  default: {
    card: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    dot: 'bg-slate-500',
  },
}

interface AgentStatusGridProps {
  /** Custom polling interval in milliseconds (default: 10000) */
  refetchInterval?: number
  /** Callback when agent is clicked */
  onAgentClick?: (agent: AgentAvailability) => void
}

/**
 * Agent Status Grid Component
 *
 * Displays all agents in a responsive grid with real-time status indicators.
 * Features:
 * - Grid layout showing agent cards with status badges
 * - Status color coding: green (idle), yellow (active), red (busy/offline)
 * - 10s auto-polling with visual update indicator
 * - Clickable cards to show task details
 * - Graceful error handling with retry capability
 * - Responsive design (1-2-4 columns based on screen size)
 */
export function AgentStatusGrid({ refetchInterval = 10 * 1000, onAgentClick }: AgentStatusGridProps) {
  const { agents, isLoading, error, isFetching } = useAgentStatus({ refetchInterval })

  // Error state with no data
  if ((error && !agents) || agents?.length === 0) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
        <p className="font-semibold mb-2">Error loading agent statuses</p>
        <p className="text-sm">{error ? String(error) : 'No agents available'}</p>
      </div>
    )
  }

  // Loading state with no data
  if (isLoading && !agents) {
    return <AgentStatusSkeletons />
  }

  // No agents found
  if (!agents?.length) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No agents available</p>
      </div>
    )
  }

  const isUpdating = isFetching && !!agents

  const handleAgentClick = (agent: AgentAvailability) => {
    onAgentClick?.(agent)
  }

  const getStatusColors = (status: AgentStatus): StatusColors => {
    return STATUS_COLORS[status] || STATUS_COLORS.default
  }

  return (
    <div className="space-y-6">
      {/* Header with update indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Agent Status Dashboard</h2>
        {isUpdating && (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Updating in real-time...
          </div>
        )}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleAgentClick(agent)}
            className="text-left rounded-lg border-2 border-slate-700 bg-slate-800 p-4 transition-all hover:border-slate-600 hover:shadow-lg"
            title={`Click to view ${agent.name}'s task details`}
          >
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">{agent.name}</h3>
                <p className="text-xs text-slate-400 capitalize">{agent.role}</p>
              </div>
            </div>

            {/* Status Badge */}
            {(() => {
              const colors = getStatusColors(agent.status as AgentStatus)
              return (
                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded border mb-3 text-xs font-medium ${colors.card}`}>
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className="capitalize">{agent.status}</span>
                </div>
              )
            })()}

            {/* Metrics Grid */}
            <div className="space-y-2 text-sm mb-3">
              {/* Tasks In Progress */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tasks:</span>
                <span className="font-semibold text-blue-300">{agent.metadata.tasksInProgress}</span>
              </div>

              {/* Tasks Completed */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Completed:</span>
                <span className="font-semibold text-green-300">{agent.metadata.tasksCompleted}</span>
              </div>

              {/* Error Rate */}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Error Rate:</span>
                <span className={`font-semibold ${agent.metadata.errorRate > 5 ? 'text-red-300' : 'text-yellow-300'}`}>
                  {agent.metadata.errorRate}%
                </span>
              </div>
            </div>

            {/* Last Activity */}
            <div className="text-xs text-slate-500 border-t border-slate-700 pt-3">
              <p>
                Last active:{' '}
                {agent.metadata.lastActivityAt
                  ? new Date(agent.metadata.lastActivityAt).toLocaleTimeString()
                  : 'Never'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-500">
        <p>Showing {agents.length} agent{agents.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
