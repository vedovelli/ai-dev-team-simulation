/**
 * MSW Handlers for Settings
 *
 * Mock API endpoints for user settings management:
 * - GET /api/settings/{section} - Fetch settings for a specific section
 * - PATCH /api/settings/{section} - Update settings for a specific section
 */

import { http, HttpResponse } from 'msw'
import type { SettingsSection, ProfileSettings, NotificationSettings, DisplaySettings } from '../../types/settings'

/**
 * In-memory store for user settings
 * Maintains state across requests for realistic behavior
 */
const settingsStore = new Map<SettingsSection, ProfileSettings | NotificationSettings | DisplaySettings>()

/**
 * Initialize default settings for all sections
 */
function initializeSettings() {
  const profileSettings: ProfileSettings = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    bio: 'Senior fullstack developer specializing in React and TypeScript',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    updatedAt: new Date().toISOString(),
  }

  const notificationSettings: NotificationSettings = {
    id: 'user-1',
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    notificationFrequency: 'instant',
    mutedKeywords: ['spam', 'test'],
    unsubscribedCategories: ['marketing', 'weekly-digest'],
    updatedAt: new Date().toISOString(),
  }

  const displaySettings: DisplaySettings = {
    id: 'user-1',
    theme: 'dark',
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    itemsPerPage: 20,
    compactMode: false,
    updatedAt: new Date().toISOString(),
  }

  settingsStore.set('profile', profileSettings)
  settingsStore.set('notifications', notificationSettings)
  settingsStore.set('display', displaySettings)
}

// Initialize settings on module load
initializeSettings()

export const settingsHandlers = [
  /**
   * GET /api/settings/{section}
   * Fetch settings for a specific section
   */
  http.get('/api/settings/:section', ({ params }) => {
    const { section } = params as { section: SettingsSection }

    const settings = settingsStore.get(section)

    if (!settings) {
      return HttpResponse.json(
        { error: `Settings section "${section}" not found` },
        { status: 404 }
      )
    }

    return HttpResponse.json(settings, { status: 200 })
  }),

  /**
   * PATCH /api/settings/{section}
   * Update settings for a specific section (partial update)
   */
  http.patch('/api/settings/:section', async ({ params, request }) => {
    const { section } = params as { section: SettingsSection }

    const currentSettings = settingsStore.get(section)
    if (!currentSettings) {
      return HttpResponse.json(
        { error: `Settings section "${section}" not found` },
        { status: 404 }
      )
    }

    try {
      const updates = await request.json() as Record<string, unknown>

      // Merge updates with current settings
      const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      settingsStore.set(section, updatedSettings)

      return HttpResponse.json(updatedSettings, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),
]
