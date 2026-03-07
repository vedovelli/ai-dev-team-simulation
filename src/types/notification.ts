/**
 * Notification types and interfaces for real-time notification center
 */

export type NotificationType = 'agent_event' | 'sprint_change' | 'performance_alert'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: string
  read: boolean
  metadata?: Record<string, unknown>
}

export interface NotificationsResponse {
  data: Notification[]
  total: number
  unreadCount: number
}
