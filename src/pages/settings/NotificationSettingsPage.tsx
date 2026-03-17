import { useForm } from '@tanstack/react-form'
import { useState, useEffect, useCallback } from 'react'
import type { NotificationPreferences, NotificationTypePreference } from '../../types/notification-preferences'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { useToast } from '../../components/Toast'
import { NotificationTypeRow } from './components/NotificationTypeRow'
import { ResetPreferencesDialog } from '../../components/NotificationPreferences/ResetPreferencesDialog'

/**
 * Notification types to display on the settings page
 */
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

interface NotificationSettingsFormData {
  preferences: Record<string, NotificationTypePreference>
}

/**
 * Notification Settings Page
 *
 * Allows users to manage per-notification-type preferences including:
 * - Frequency (instant, daily, off)
 * - Channels (in-app, email)
 *
 * Features:
 * - Form validation: at least one channel must be enabled per notification type
 * - Optimistic updates on save
 * - Reset to defaults with confirmation
 * - Success/error toasts
 * - Loading and disabled states
 */
export function NotificationSettingsPage() {
  const { preferences, isLoading, isUpdating, updatePreferences, resetPreferences } =
    useNotificationPreferences()
  const { showToast } = useToast()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Initialize form with preferences data
  const form = useForm<NotificationSettingsFormData>({
    defaultValues: {
      preferences: preferences
        ? Object.fromEntries(
            NOTIFICATION_TYPES.map((type) => [
              type,
              preferences[type as keyof NotificationPreferences] as NotificationTypePreference,
            ])
          )
        : {},
    },
    onSubmit: async ({ value }) => {
      // Validate that at least one channel is enabled per notification type
      const errors: Record<string, string> = {}
      Object.entries(value.preferences).forEach(([type, pref]) => {
        if (pref.channels.length === 0) {
          errors[type] = 'At least one channel must be selected'
        }
      })

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        showToast('Please fix validation errors', 'error')
        return
      }

      setFieldErrors({})

      try {
        updatePreferences(value.preferences)
        showToast('Preferences saved successfully!', 'success')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save preferences'
        showToast(message, 'error')
      }
    },
  })

  // Reset form when preferences change (after successful update)
  useEffect(() => {
    if (preferences && !isUpdating) {
      const newPrefs = Object.fromEntries(
        NOTIFICATION_TYPES.map((type) => [
          type,
          preferences[type as keyof NotificationPreferences] as NotificationTypePreference,
        ])
      )
      form.setFieldValue('preferences', newPrefs)
      setFieldErrors({})
    }
  }, [preferences, isUpdating, form])

  const handlePreferenceChange = useCallback(
    (type: string, preference: NotificationTypePreference) => {
      form.setFieldValue('preferences', (prev) => ({
        ...prev,
        [type]: preference,
      }))
      // Clear error for this field when user changes it using functional update
      setFieldErrors((prev) => {
        if (prev[type]) {
          const next = { ...prev }
          delete next[type]
          return next
        }
        return prev
      })
    },
    [form]
  )

  const handleReset = useCallback(async () => {
    setIsResetting(true)
    try {
      await resetPreferences()
      setShowResetDialog(false)
      setFieldErrors({})
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
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Loading notification preferences...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notification Settings</h1>
          <p className="text-slate-400">Manage how and when you receive notifications</p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-8"
        >
          {/* Settings Card */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-8">
            {/* Notification Type Rows */}
            <div className="space-y-0">
              {NOTIFICATION_TYPES.map((type) => (
                <NotificationTypeRow
                  key={type}
                  type={type}
                  preference={form.getFieldValue('preferences')?.[type] || {
                    enabled: true,
                    frequency: 'instant',
                    channels: ['in-app', 'email'],
                  }}
                  onChange={(preference) => handlePreferenceChange(type, preference)}
                  isLoading={isUpdating}
                  channelError={fieldErrors[type]}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between">
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              disabled={isUpdating || isResetting}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Reset to Defaults
            </button>

            <button
              type="submit"
              disabled={isUpdating || isLoading}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

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
