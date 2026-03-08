import type { Task, Agent } from '../types'
import { useAgentPresence } from '../hooks/useAgentPresence'
import { canAssignTaskToAgent, getTaskAssignmentBlockReason } from '../lib/presence'

interface TaskAssignmentWithPresenceProps {
  agent: Agent
}

/**
 * Validates if a task can be assigned to an agent based on presence status
 * Used in TaskAssignmentModal to prevent assignment to unavailable agents
 */
export function canAssignTaskByPresence(agentId: string, presenceList: any[]): boolean {
  const presence = presenceList?.find((p) => p.id === agentId)
  if (!presence) return true // Unknown presence, allow assignment

  return canAssignTaskToAgent(presence.presence)
}

/**
 * Get presence-based assignment restriction reason
 */
export function getPresenceRestrictionReason(
  agentId: string,
  presenceList: any[]
): string | null {
  const presence = presenceList?.find((p) => p.id === agentId)
  if (!presence) return null

  return getTaskAssignmentBlockReason(presence.presence)
}

/**
 * Agent presence indicator for task assignment
 * Shows presence status and blocks assignment if unavailable
 */
export function AgentPresenceIndicator({
  agent,
}: TaskAssignmentWithPresenceProps) {
  const { data: presenceList } = useAgentPresence()

  const agentPresence = presenceList?.find((p) => p.id === agent.id)
  const canAssign = canAssignTaskByPresence(agent.id, presenceList)
  const blockReason = getPresenceRestrictionReason(agent.id, presenceList)

  if (!agentPresence) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100">
        {agentPresence.presence}
      </span>
      {!canAssign && blockReason && (
        <span className="text-red-600 text-xs">{blockReason}</span>
      )}
    </div>
  )
}
