/**
 * Main notification preferences settings panel
 * Displays all notification types with their frequency and channel controls
 * Connects to useNotificationPreferences hook for data fetching and updates
 */

import { useState, useEffect } from 'react'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { NotificationTypeToggle } from './NotificationTypeToggle'
import type { NotificationPreferences, NotificationTypePreference, UpdatePreferencesRequest } from '../../types/notification-preferences'

const NOTIFICATION_TYPES = [
  'assignment_changed',
  'sprint_updated',
  'task_reassigned',
  'deadline_approaching',
  'task_assigned',
  'task_unassigned',
  'sprint_started',
  'sprint_completed',
  'comment_added',
  'status_changed',
  'agent_event',
  'performance_alert',
] as const

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, isError, updatePreferences } = useNotificationPreferences()

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences> | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Sync fetched preferences to local state
  useEffect(() => {
    if (preferences && !localPreferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences, localPreferences])

  // Detect if there are unsaved changes
  useEffect(() => {
    if (!preferences || !localPreferences) {
      setHasUnsavedChanges(false)
      return
    }

    const hasChanges = NOTIFICATION_TYPES.some((type) => {
      const orig = preferences[type as keyof NotificationPreferences]
      const local = localPreferences[type as keyof NotificationPreferences]
      return JSON.stringify(orig) !== JSON.stringify(local)
    })

    setHasUnsavedChanges(hasChanges)
  }, [localPreferences, preferences])

  const handlePreferenceChange = (type: string, preference: NotificationTypePreference) => {
    setLocalPreferences((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [type]: preference,
      }
    })
  }

  const handleSave = () => {
    if (!localPreferences || !preferences) return

    const patch: UpdatePreferencesRequest = {}
    let hasChanges = false

    NOTIFICATION_TYPES.forEach((type) => {
      const orig = preferences[type as keyof NotificationPreferences]
      const local = localPreferences[type as keyof NotificationPreferences]

      if (JSON.stringify(orig) !== JSON.stringify(local)) {
        patch[type as keyof UpdatePreferencesRequest] = local as NotificationTypePreference
        hasChanges = true
      }
    })

    if (hasChanges) {
      updatePreferences(patch)
      setHasUnsavedChanges(false)
    }
  }

  const handleCancel = () => {
    setLocalPreferences(preferences || null)
    setHasUnsavedChanges(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (isError || !preferences || !localPreferences) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-red-800 text-sm">Failed to load notification preferences. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Notification Preferences</h2>
        <p className="text-slate-600 text-sm">
          Control how and when you receive notifications for each notification type.
        </p>
      </div>

      {/* Settings panel */}
      <fieldset className="border border-slate-200 rounded-lg p-6 space-y-0">
        <legend className="sr-only">Notification Settings</legend>

        {NOTIFICATION_TYPES.map((type) => (
          <NotificationTypeToggle
            key={type}
            type={type}
            preference={localPreferences[type as keyof NotificationPreferences] as NotificationTypePreference}
            onChange={(pref) => handlePreferenceChange(type, pref)}
          />
        ))}
      </fieldset>

      {/* Action buttons - shown only if there are unsaved changes */}
      {hasUnsavedChanges && (
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-200 text-slate-900 font-medium text-sm rounded hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
