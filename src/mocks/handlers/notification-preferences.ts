import { http, HttpResponse } from 'msw'
import type { NotificationPreferences, UpdateNotificationPreferencesPayload } from '../../types/notification-preferences'

/**
 * Generate default notification preferences for a user
 * All notification types are enabled with instant frequency via in-app channel
 */
function generateDefaultPreferences(): NotificationPreferences {
  return {
    userId: 'user-1',
    enabled: true,
    types: [
      { type: 'task_assigned', frequency: 'instant', channels: ['in-app', 'email'] },
      { type: 'task_unassigned', frequency: 'instant', channels: ['in-app'] },
      { type: 'sprint_started', frequency: 'instant', channels: ['in-app', 'email'] },
      { type: 'sprint_completed', frequency: 'daily', channels: ['in-app', 'email'] },
      { type: 'comment_added', frequency: 'instant', channels: ['in-app'] },
      { type: 'status_changed', frequency: 'instant', channels: ['in-app'] },
      { type: 'agent_event', frequency: 'daily', channels: ['in-app'] },
      { type: 'performance_alert', frequency: 'instant', channels: ['in-app', 'email'] },
      { type: 'assignment_changed', frequency: 'instant', channels: ['in-app', 'email'] },
      { type: 'sprint_updated', frequency: 'daily', channels: ['in-app'] },
      { type: 'task_reassigned', frequency: 'instant', channels: ['in-app'] },
      { type: 'deadline_approaching', frequency: 'instant', channels: ['in-app', 'email'] },
    ],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * In-memory store for user notification preferences
 * In production, this would be persisted in a database
 */
let preferencesStore = generateDefaultPreferences()

export const notificationPreferencesHandlers = [
  /**
   * GET /api/notification-preferences
   * Fetch current user's notification preferences
   * Returns all configured notification type preferences and global settings
   */
  http.get('/api/notification-preferences', () => {
    return HttpResponse.json({
      data: preferencesStore,
      success: true,
    })
  }),

  /**
   * PATCH /api/notification-preferences
   * Update user's notification preferences
   * Supports partial updates and optimistic updates on client
   *
   * Features:
   * - Merge updates with existing preferences
   * - Validate notification types
   * - Simulate 200ms network delay
   * - Return updated preferences
   */
  http.patch('/api/notification-preferences', async ({ request }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    const payload = (await request.json()) as UpdateNotificationPreferencesPayload

    // Merge payload with existing preferences
    const updated: NotificationPreferences = {
      ...preferencesStore,
      // Update enabled flag if provided
      ...(payload.enabled !== undefined && { enabled: payload.enabled }),
      // Replace type preferences if provided
      ...(payload.types && { types: payload.types }),
      // Always update the timestamp
      updatedAt: new Date().toISOString(),
    }

    // Validate that userId doesn't change
    updated.userId = preferencesStore.userId

    // Update store
    preferencesStore = updated

    return HttpResponse.json({
      data: updated,
      success: true,
    })
  }),

  /**
   * POST /api/notification-preferences/reset
   * Reset preferences to defaults
   * Useful for "reset to defaults" button in settings UI
   */
  http.post('/api/notification-preferences/reset', () => {
    preferencesStore = generateDefaultPreferences()

    return HttpResponse.json({
      data: preferencesStore,
      success: true,
    })
  }),
]
