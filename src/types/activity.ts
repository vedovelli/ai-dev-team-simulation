/**
 * Activity event types for the sprint activity feed
 * - task_assigned: When a task is assigned to an agent
 * - task_status_changed: When a task status changes
 * - comment_added: When a comment is added to a task
 * - sprint_updated: When sprint details are modified
 * - sprint_archived: When a sprint is archived
 */
export type ActivityEventType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'comment_added'
  | 'sprint_updated'
  | 'sprint_archived'
  // Legacy types for backward compatibility
  | 'task_created'
  | 'task_completed'
  | 'agent_status_change'

export type EntityType = 'sprint' | 'task' | 'agent'

export type ReactionEmoji = '👍' | '❤️' | '🚀'

export interface Reaction {
  emoji: ReactionEmoji
  count: number
  userReacted?: boolean
}

/**
 * Represents a single activity event in the feed
 */
export interface ActivityEvent {
  id: string
  type: ActivityEventType
  entityType: EntityType
  entityId: string
  actorName: string
  payload: Record<string, unknown>
  createdAt: string
  // Legacy fields for backward compatibility
  actor?: string
  timestamp?: string
  metadata?: Record<string, unknown>
  reactions?: Record<ReactionEmoji, number>
}

/**
 * Paginated activity feed response with cursor support
 */
export interface ActivityFeedResponse {
  events: ActivityEvent[]
  nextCursor: string | null
  hasMore: boolean
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
