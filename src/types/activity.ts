export type ActivityEventType =
  | 'task_created'
  | 'task_completed'
  | 'task_assigned'
  | 'agent_status_change'

export type ReactionEmoji = '👍' | '❤️' | '🚀'

export interface Reaction {
  emoji: ReactionEmoji
  count: number
  userReacted?: boolean
}

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  actor: string
  timestamp: string
  metadata?: Record<string, unknown>
  reactions?: Record<ReactionEmoji, number>
}

/**
 * @deprecated Use ActivityEvent instead
 */
export interface Activity {
  id: string
  type: ActivityEventType
  agentId: string
  agentName: string
  message: string
  timestamp: string
  details?: Record<string, unknown>
}
