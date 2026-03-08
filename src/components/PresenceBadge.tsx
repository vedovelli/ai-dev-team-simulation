import type { AgentPresenceStatus } from '../types/agent'

interface PresenceBadgeProps {
  presence: AgentPresenceStatus
  lastSeenAt?: string
  className?: string
}

/**
 * Get icon for presence status
 */
function getPresenceIcon(presence: AgentPresenceStatus): string {
  switch (presence) {
    case 'online':
      return '●' // Filled circle for online
    case 'away':
      return '◐' // Half circle for away
    case 'busy':
      return '◆' // Diamond for busy
    case 'offline':
      return '○' // Empty circle for offline
    default:
      return '?'
  }
}

/**
 * Get color classes for presence status
 */
function getPresenceColor(presence: AgentPresenceStatus): string {
  switch (presence) {
    case 'online':
      return 'text-green-500 bg-green-50'
    case 'away':
      return 'text-yellow-500 bg-yellow-50'
    case 'busy':
      return 'text-orange-500 bg-orange-50'
    case 'offline':
      return 'text-gray-400 bg-gray-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}

/**
 * Get human-readable label for presence status
 */
function getPresenceLabel(presence: AgentPresenceStatus): string {
  switch (presence) {
    case 'online':
      return 'Online'
    case 'away':
      return 'Away'
    case 'busy':
      return 'Busy'
    case 'offline':
      return 'Offline'
    default:
      return 'Unknown'
  }
}

/**
 * Format last seen timestamp
 */
function formatLastSeen(lastSeenAt: string | undefined): string {
  if (!lastSeenAt) return 'Unknown'

  const now = new Date()
  const then = new Date(lastSeenAt)
  const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 1000 / 60)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Presence badge with icon and tooltip
 * Displays real-time presence status for agents
 */
export function PresenceBadge({
  presence,
  lastSeenAt,
  className = '',
}: PresenceBadgeProps) {
  const icon = getPresenceIcon(presence)
  const colorClass = getPresenceColor(presence)
  const label = getPresenceLabel(presence)
  const lastSeen = formatLastSeen(lastSeenAt)

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium ${colorClass} ${className}`}
      title={`${label} - Last seen: ${lastSeen}`}
    >
      <span className="text-xs">{icon}</span>
      <span>{label}</span>
    </div>
  )
}
