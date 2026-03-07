import { useAgentStatus } from '../../hooks/useAgentStatus'
import { AgentStatusIndicator } from './AgentStatusIndicator'
import { AgentStatusSkeletons } from './AgentStatusSkeletons'

interface AgentStatusPanelProps {
  agentId: string
  /** Custom polling interval in milliseconds (default: 10000) */
  refetchInterval?: number
}

/**
 * Agent Status Panel component
 *
 * Displays real-time agent availability status including:
 * - Current status (idle, active, busy, offline)
 * - Agent capabilities
 * - Task allocation info
 * - Error rate and activity metrics
 *
 * Features:
 * - Real-time status polling every 10 seconds
 * - Graceful error handling with retry
 * - Loading states during data fetch
 * - Responsive layout
 */
export function AgentStatusPanel({ agentId, refetchInterval = 10 * 1000 }: AgentStatusPanelProps) {
  const { data, isLoading, error, isFetching } = useAgentStatus(agentId, { refetchInterval })

  if (!agentId) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No agent selected</p>
      </div>
    )
  }

  // Error state with no data
  if (error && !data) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-red-200">
        <p className="font-semibold mb-2">Error loading agent status</p>
        <p className="text-sm mb-4">{error.message}</p>
      </div>
    )
  }

  // Loading state with no data
  if (isLoading && !data) {
    return <AgentStatusSkeletons />
  }

  // No data available
  if (!data) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
        <p className="text-lg">No agent data available</p>
      </div>
    )
  }

  const isUpdating = isFetching && !!data

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{data.name}</h2>
            <p className="text-slate-400 text-sm capitalize">Role: {data.role}</p>
          </div>
          <AgentStatusIndicator status={data.status} isUpdating={isUpdating} />
        </div>

        {/* Last activity timestamp */}
        <p className="text-xs text-slate-500">
          Last activity: {new Date(data.metadata.lastActivityAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Status Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Badge */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-slate-400 mb-2">Current Status</p>
          <p className="text-xl font-bold text-white capitalize">{data.status}</p>
          <p className="text-xs text-slate-500 mt-2">
            Changed: {new Date(data.statusChangedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Tasks In Progress */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-slate-400 mb-2">Tasks In Progress</p>
          <p className="text-3xl font-bold text-blue-400">{data.metadata.tasksInProgress}</p>
          {data.currentTaskId && (
            <p className="text-xs text-blue-300 mt-2 truncate">ID: {data.currentTaskId}</p>
          )}
        </div>

        {/* Tasks Completed */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-slate-400 mb-2">Tasks Completed</p>
          <p className="text-3xl font-bold text-green-400">{data.metadata.tasksCompleted}</p>
        </div>

        {/* Error Rate */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <p className="text-sm text-slate-400 mb-2">Error Rate</p>
          <p className={`text-3xl font-bold ${data.metadata.errorRate > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
            {data.metadata.errorRate}%
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Capabilities</h3>
        <div className="flex flex-wrap gap-2">
          {data.capabilities.map((capability) => (
            <span
              key={capability}
              className="bg-slate-700 text-slate-200 text-xs px-3 py-1 rounded-full"
            >
              {capability}
            </span>
          ))}
        </div>
      </div>

      {/* Footer with update indicator */}
      {isUpdating && (
        <div className="text-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Updating...
          </span>
        </div>
      )}
    </div>
  )
}
