/**
 * Main notification preferences settings panel
 * Displays all notification types grouped by category with their frequency and channel controls
 * Connects to useNotificationPreferences hook for data fetching and updates
 */

import { useState, useEffect, useCallback } from 'react'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { useToast } from '../Toast'
import { NotificationPreferenceRow } from './NotificationPreferenceRow'
import type { NotificationPreferences, NotificationTypePreference, UpdatePreferencesRequest } from '../../types/notification-preferences'

/**
 * Notification types grouped by category for better organization
 */
const NOTIFICATION_CATEGORIES = {
  'Task Notifications': [
    'task_assigned',
    'task_unassigned',
    'task_reassigned',
  ] as const,
  'Sprint Notifications': [
    'sprint_started',
    'sprint_completed',
    'sprint_updated',
  ] as const,
  'System & Activity': [
    'comment_added',
    'status_changed',
    'assignment_changed',
    'deadline_approaching',
    'agent_event',
    'performance_alert',
  ] as const,
}

const ALL_NOTIFICATION_TYPES = [
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

interface ResetPreferencesDialogProps {
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

function ResetPreferencesDialog({ onConfirm, onCancel, isPending }: ResetPreferencesDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Reset to Defaults?</h3>
        <p className="text-slate-600 text-sm mb-6">
          This will reset all notification preferences to their default values. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded font-medium transition-colors"
          >
            {isPending ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, isError, isUpdating, updatePreferences, resetPreferences } = useNotificationPreferences()
  const { showToast } = useToast()

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences> | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Sync fetched preferences to local state
  useEffect(() => {
    if (preferences && !localPreferences) {
      setLocalPreferences(preferences)
    }
  }, [preferences, localPreferences])

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // Detect if there are unsaved changes
  useEffect(() => {
    if (!preferences || !localPreferences) {
      setHasUnsavedChanges(false)
      return
    }

    const hasChanges = ALL_NOTIFICATION_TYPES.some((type) => {
      const orig = preferences[type as keyof NotificationPreferences]
      const local = localPreferences[type as keyof NotificationPreferences]
      return JSON.stringify(orig) !== JSON.stringify(local)
    })

    setHasUnsavedChanges(hasChanges)
  }, [localPreferences, preferences])

  const handlePreferenceChange = useCallback((type: string, preference: NotificationTypePreference) => {
    setLocalPreferences((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [type]: preference,
      }
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!localPreferences || !preferences) return

    const patch: UpdatePreferencesRequest = {}
    let hasChanges = false

    ALL_NOTIFICATION_TYPES.forEach((type) => {
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
      showToast('Preferences saved successfully!', 'success')
    }
  }, [localPreferences, preferences, updatePreferences, showToast])

  const handleReset = useCallback(async () => {
    setIsResetting(true)
    try {
      await resetPreferences()
      setShowResetDialog(false)
      setHasUnsavedChanges(false)
      showToast('Preferences reset to defaults', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset preferences'
      showToast(message, 'error')
    } finally {
      setIsResetting(false)
    }
  }, [resetPreferences, showToast])

  // Show loading skeleton during initial fetch
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <fieldset key={i} className="space-y-3">
              <div className="h-6 bg-slate-200 rounded animate-pulse w-1/4" />
              <div className="bg-white rounded border border-slate-200 space-y-4 p-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-12 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (isError || !preferences || !localPreferences) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-red-800 text-sm font-medium">Failed to load notification preferences</p>
        <p className="text-red-700 text-sm mt-1">Please refresh the page and try again.</p>
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

      {/* Settings by category */}
      {Object.entries(NOTIFICATION_CATEGORIES).map(([category, notificationTypes]) => (
        <fieldset key={category} className="space-y-3">
          <legend className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            {category}
          </legend>
          <div className="bg-white rounded border border-slate-200">
            {notificationTypes.map((type) => (
              <NotificationPreferenceRow
                key={type}
                type={type}
                preference={localPreferences[type as keyof NotificationPreferences] as NotificationTypePreference}
                onChange={(pref) => handlePreferenceChange(type, pref)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isUpdating}
          className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 disabled:bg-slate-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => setShowResetDialog(true)}
          disabled={isUpdating || isResetting}
          className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed font-medium text-sm rounded transition-colors"
        >
          Reset to Defaults
        </button>
        {hasUnsavedChanges && (
          <span className="text-xs text-slate-500 ml-auto">Unsaved changes</span>
        )}
      </div>

      {/* Reset confirmation dialog */}
      {showResetDialog && (
        <ResetPreferencesDialog
          onConfirm={handleReset}
          onCancel={() => setShowResetDialog(false)}
          isPending={isResetting}
        />
      )}
    </div>
  )
}
