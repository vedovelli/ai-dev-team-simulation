import type { AgentPresenceStatus } from '../types/agent'

/**
 * Check if an agent can accept task assignments based on their presence status
 *
 * Task assignment is allowed only for:
 * - Online agents
 * - Busy agents (can queue tasks even if occupied)
 *
 * Task assignment is prevented for:
 * - Away agents (likely AFK)
 * - Offline agents (not available)
 *
 * @param presence Agent presence status
 * @returns true if agent can accept new task assignments
 */
export function canAssignTaskToAgent(presence: AgentPresenceStatus): boolean {
  return presence === 'online' || presence === 'busy'
}

/**
 * Get human-readable reason why task cannot be assigned to agent
 *
 * @param presence Agent presence status
 * @returns Reason string or null if task can be assigned
 */
export function getTaskAssignmentBlockReason(
  presence: AgentPresenceStatus
): string | null {
  switch (presence) {
    case 'away':
      return 'Agent is away and may not respond promptly'
    case 'offline':
      return 'Agent is offline and cannot receive tasks'
    case 'online':
    case 'busy':
      return null
    default:
      return 'Unknown presence status'
  }
}

/**
 * Check if presence status indicates agent is definitely unavailable
 *
 * @param presence Agent presence status
 * @returns true if agent is unavailable
 */
export function isAgentUnavailable(presence: AgentPresenceStatus): boolean {
  return presence === 'offline' || presence === 'away'
}
