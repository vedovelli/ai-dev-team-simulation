/**
 * Notification preferences and configuration
 */

import type { NotificationType } from './notification'

/**
 * Frequency options for notifications
 */
export type NotificationFrequency = 'instant' | 'daily' | 'off'

/**
 * Channel options for notifications
 */
export type NotificationChannel = 'in-app' | 'email'

/**
 * Preferences for a single notification type
 */
export interface NotificationTypePreference {
  enabled: boolean
  frequency: NotificationFrequency
  channels: NotificationChannel[]
}

/**
 * User's complete notification preferences
 */
export interface NotificationPreferences {
  id: string
  userId: string
  createdAt: string
  updatedAt: string

  // Per-notification-type preferences
  assignment_changed: NotificationTypePreference
  sprint_updated: NotificationTypePreference
  task_reassigned: NotificationTypePreference
  deadline_approaching: NotificationTypePreference
  task_assigned: NotificationTypePreference
  task_unassigned: NotificationTypePreference
  sprint_started: NotificationTypePreference
  sprint_completed: NotificationTypePreference
  comment_added: NotificationTypePreference
  status_changed: NotificationTypePreference
  agent_event: NotificationTypePreference
  performance_alert: NotificationTypePreference

  // Global settings
  quiet_hours_enabled: boolean
  quiet_hours_start: string // HH:mm format
  quiet_hours_end: string   // HH:mm format
}

/**
 * API response for fetching preferences
 */
export interface PreferencesResponse {
  data: NotificationPreferences
}

/**
 * API request for updating preferences
 */
export interface UpdatePreferencesRequest {
  [key in NotificationType]?: NotificationTypePreference
}
