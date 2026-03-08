import type { Agent } from '../types/agent'
import { AgentCard } from './AgentCard'
import { PresenceBadge } from './PresenceBadge'
import { useAgentPresenceById } from '../hooks/useAgentPresence'

interface AgentCardWithPresenceProps {
  agent: Agent
}

/**
 * Agent card with real-time presence status
 * Extends AgentCard with presence badge and availability information
 */
export function AgentCardWithPresence({ agent }: AgentCardWithPresenceProps) {
  const presence = useAgentPresenceById(agent.id)

  return (
    <div className="relative">
      <AgentCard agent={agent} />

      {/* Presence badge overlay */}
      {presence && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <PresenceBadge presence={presence.presence} lastSeenAt={presence.lastSeenAt} />
        </div>
      )}
    </div>
  )
}
