/**
 * Main notification preferences settings panel
 * Surfaces the useNotificationPreferences hook to allow users to control
 * how and when they receive notifications
 */

import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { useToast } from '../Toast'
import { PreferencesSkeletonLoader } from './PreferencesSkeletonLoader'
import { NotificationTypeRow } from './NotificationTypeRow'
import { PreferencesSaveBar } from './PreferencesSaveBar'
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
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { preferences, isLoading, isUpdating, updateError, updatePreferences, resetPreferences } =
    useNotificationPreferences()

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences> | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSaveBar, setShowSaveBar] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Sync preferences to local state when loaded
  useEffect(() => {
    if (preferences && !localPreferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences, localPreferences])

  // Detect unsaved changes
  useEffect(() => {
    if (!preferences || !localPreferences) return

    const hasChanges = NOTIFICATION_TYPES.some((type) => {
      const orig = preferences[type as keyof NotificationPreferences]
      const local = localPreferences[type as keyof NotificationPreferences]
      return JSON.stringify(orig) !== JSON.stringify(local)
    })

    setHasUnsavedChanges(hasChanges)
    setShowSaveBar(hasChanges)
  }, [localPreferences, preferences])

  // Handle update error
  useEffect(() => {
    if (updateError) {
      showToast(`Failed to save preferences: ${updateError.message}`, 'error')
    }
  }, [updateError, showToast])

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
      showToast('Preferences saved successfully', 'success')
      setHasUnsavedChanges(false)
      setShowSaveBar(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges && !window.confirm('Discard unsaved changes?')) {
      return
    }

    setLocalPreferences(preferences || null)
    setHasUnsavedChanges(false)
    setShowSaveBar(false)
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all preferences to defaults? This cannot be undone.')) {
      return
    }

    setIsResetting(true)
    try {
      await resetPreferences()
      showToast('Preferences reset to defaults', 'success')
      setHasUnsavedChanges(false)
      setShowSaveBar(false)
    } catch (error) {
      showToast(
        `Failed to reset preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsResetting(false)
    }
  }

  // Warn on unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (isLoading) {
    return <PreferencesSkeletonLoader />
  }

  if (!preferences || !localPreferences) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Failed to load preferences. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Notification Preferences</h1>
        <p className="text-slate-600">
          Control how and when you receive notifications across different notification types.
        </p>
      </div>

      <fieldset className="border border-slate-200 rounded-lg p-6 space-y-0">
        <legend className="text-lg font-semibold text-slate-900 mb-6 block">Notification Settings</legend>

        {NOTIFICATION_TYPES.map((type) => (
          <NotificationTypeRow
            key={type}
            type={type}
            preference={localPreferences[type as keyof NotificationPreferences] as NotificationTypePreference}
            onChange={(pref) => handlePreferenceChange(type, pref)}
          />
        ))}
      </fieldset>

      <PreferencesSaveBar
        isVisible={showSaveBar}
        isSaving={isUpdating || isResetting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onCancel={handleCancel}
        onReset={handleReset}
      />
    </div>
  )
}
