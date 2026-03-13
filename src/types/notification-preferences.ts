/**
 * Notification Preferences Types
 *
 * User settings for controlling notification behavior across the application.
 * Supports subscription control, frequency modes, and delivery channels.
 */

/**
 * Frequency modes for notifications
 * - instant: Receive notifications immediately
 * - daily: Receive a daily digest
 * - off: Disable notifications for this type
 */
export type NotificationFrequency = 'instant' | 'daily' | 'off'

/**
 * Delivery channels for notifications
 * - in-app: Notifications appear in the app notification center
 * - email: Notifications sent via email
 */
export type NotificationChannel = 'in-app' | 'email'

/**
 * Notification types that can be controlled via preferences
 * Matches NotificationType but used for preference configuration
 */
export type NotificationTypePreference =
  | 'task_assigned'
  | 'task_unassigned'
  | 'sprint_started'
  | 'sprint_completed'
  | 'comment_added'
  | 'status_changed'
  | 'agent_event'
  | 'performance_alert'
  | 'assignment_changed'
  | 'sprint_updated'
  | 'task_reassigned'
  | 'deadline_approaching'

/**
 * Per-notification-type preference settings
 */
export interface NotificationTypePreferences {
  /** Notification type identifier */
  type: NotificationTypePreference
  /** Frequency mode for this notification type */
  frequency: NotificationFrequency
  /** Delivery channels enabled for this type */
  channels: NotificationChannel[]
}

/**
 * User notification preferences
 * Controls which notifications are received, how frequently, and via which channels
 */
export interface NotificationPreferences {
  /** User ID */
  userId: string
  /** Global notification enable/disable */
  enabled: boolean
  /** Preferences grouped by notification type */
  types: NotificationTypePreferences[]
  /** Timestamp when preferences were last updated */
  updatedAt: string
}

/**
 * Payload for updating notification preferences
 * Supports partial updates (only specified fields are updated)
 */
export interface UpdateNotificationPreferencesPayload {
  /** Global notification enable/disable */
  enabled?: boolean
  /** Updated type preferences (replaces all existing) */
  types?: NotificationTypePreferences[]
}

/**
 * API response for notification preferences endpoints
 */
export interface NotificationPreferencesResponse {
  data: NotificationPreferences
  success: boolean
}
