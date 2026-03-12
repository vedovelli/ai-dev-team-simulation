/**
 * Notification types and interfaces for real-time notification center
 *
 * Supports multiple notification categories:
 * - task_assigned: User assigned to a task
 * - task_unassigned: User unassigned from a task
 * - sprint_started: Sprint has started
 * - sprint_completed: Sprint has completed
 * - comment_added: Comment added to task/sprint
 * - status_changed: Task or sprint status changed
 * - agent_event: General agent activity
 * - performance_alert: Performance-related alerts
 */

// Specific notification event types (structured events)
export type NotificationEventType = 'assignment_changed' | 'sprint_updated' | 'task_reassigned' | 'deadline_approaching'

// All notification types (includes both legacy and structured event types)
export type NotificationType =
  | 'task_assigned'
  | 'task_unassigned'
  | 'sprint_started'
  | 'sprint_completed'
  | 'comment_added'
  | 'status_changed'
  | 'agent_event'
  | 'performance_alert'
  | NotificationEventType

/**
 * Base notification interface
 */
export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  read: boolean
  /** Optional metadata for specific notification types */
  metadata?: NotificationMetadata
  // Optional fields for structured events
  eventType?: NotificationEventType
  relatedId?: string // ID of related entity (task, sprint, agent)
  priority?: 'low' | 'normal' | 'high'
}

/**
 * Metadata for different notification types
 */
export interface NotificationMetadata {
  /** ID of the entity (task, sprint, agent, comment) */
  entityId?: string
  /** Type of entity (task, sprint, agent, comment) */
  entityType?: 'task' | 'sprint' | 'agent' | 'comment'
  /** Priority level */
  priority?: 'low' | 'normal' | 'high'
  /** Source system */
  source?: string
  /** Associated user/agent name */
  actor?: string
  /** Additional context-specific data */
  [key: string]: unknown
}

/**
 * API response structure for notifications endpoint
 */
export interface NotificationsResponse {
  data: Notification[]
  total: number
  unreadCount: number
}

/**
 * Notification center aggregated state
 */
export interface NotificationCenter {
  notifications: Notification[]
  unreadCount: number
  total: number
}
