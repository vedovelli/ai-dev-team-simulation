import { useForm } from '@tanstack/react-form'
import { useState, useEffect, useCallback } from 'react'
import type { NotificationPreferences, NotificationTypePreference } from '../../types/notification-preferences'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { useToast } from '../Toast'
import { NotificationTypeToggle, NOTIFICATION_TYPE_LABELS } from './NotificationTypeToggle'
import { ResetPreferencesDialog } from './ResetPreferencesDialog'

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

interface NotificationPreferencesFormData {
  preferences: Record<string, NotificationTypePreference>
}

export function NotificationPreferencesForm() {
  const { preferences, isLoading, isUpdating, updatePreferences, resetPreferences } = useNotificationPreferences()
  const { showToast } = useToast()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Initialize form with preferences data
  const form = useForm<NotificationPreferencesFormData>({
    defaultValues: {
      preferences: preferences
        ? {
            assignment_changed: preferences.assignment_changed,
            sprint_updated: preferences.sprint_updated,
            task_reassigned: preferences.task_reassigned,
            deadline_approaching: preferences.deadline_approaching,
            task_assigned: preferences.task_assigned,
            task_unassigned: preferences.task_unassigned,
            sprint_started: preferences.sprint_started,
            sprint_completed: preferences.sprint_completed,
            comment_added: preferences.comment_added,
            status_changed: preferences.status_changed,
            agent_event: preferences.agent_event,
            performance_alert: preferences.performance_alert,
          }
        : {},
    },
    onSubmit: async ({ value }) => {
      try {
        updatePreferences(value.preferences)
        showToast('Preferences saved successfully!', 'success')
        setHasUnsavedChanges(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save preferences'
        showToast(message, 'error')
      }
    },
  })

  // Reset form when preferences change (after successful update)
  useEffect(() => {
    if (preferences && !isUpdating) {
      form.setFieldValue('preferences', {
        assignment_changed: preferences.assignment_changed,
        sprint_updated: preferences.sprint_updated,
        task_reassigned: preferences.task_reassigned,
        deadline_approaching: preferences.deadline_approaching,
        task_assigned: preferences.task_assigned,
        task_unassigned: preferences.task_unassigned,
        sprint_started: preferences.sprint_started,
        sprint_completed: preferences.sprint_completed,
        comment_added: preferences.comment_added,
        status_changed: preferences.status_changed,
        agent_event: preferences.agent_event,
        performance_alert: preferences.performance_alert,
      })
    }
  }, [preferences, isUpdating])

  const handlePreferenceChange = useCallback(
    (type: string, preference: NotificationTypePreference) => {
      form.setFieldValue('preferences', (prev) => ({
        ...prev,
        [type]: preference,
      }))
      setHasUnsavedChanges(true)
    },
    [form]
  )

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

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading notification preferences...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Notification Preferences</h1>
        <p className="text-slate-400">Manage how and when you receive notifications</p>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        {/* Notification Categories */}
        {Object.entries(NOTIFICATION_CATEGORIES).map(([category, notificationTypes]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">{category}</h2>
            <div className="space-y-1">
              {notificationTypes.map((type) => {
                const typePreference = form.getFieldValue('preferences')[type]
                return (
                  <div key={type}>
                    <NotificationTypeToggle
                      type={type}
                      preference={typePreference}
                      onChange={(newPref) => handlePreferenceChange(type, newPref)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
          <form.Subscribe
            selector={(formState) => [formState.isSubmitting]}
            children={([isSubmitting]) => (
              <button
                type="submit"
                disabled={!hasUnsavedChanges || isUpdating || isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
              >
                {isUpdating || isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          />

          <button
            type="button"
            onClick={() => setShowResetDialog(true)}
            disabled={isUpdating || isResetting}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded transition-colors"
          >
            Reset to Defaults
          </button>

          {hasUnsavedChanges && (
            <span className="text-sm text-slate-400 ml-auto">Unsaved changes</span>
          )}
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
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
