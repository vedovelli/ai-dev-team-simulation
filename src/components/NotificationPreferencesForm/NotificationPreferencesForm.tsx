import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import type { NotificationPreferences, NotificationTypePreference, NotificationFrequency, NotificationChannel } from '../../types/notification-preferences'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'

interface NotificationPreferencesFormProps {
  onSave?: () => void
}

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

const NOTIFICATION_LABELS: Record<string, string> = {
  assignment_changed: 'Assignment Changed',
  sprint_updated: 'Sprint Updated',
  task_reassigned: 'Task Reassigned',
  deadline_approaching: 'Deadline Approaching',
  task_assigned: 'Task Assigned',
  task_unassigned: 'Task Unassigned',
  sprint_started: 'Sprint Started',
  sprint_completed: 'Sprint Completed',
  comment_added: 'Comment Added',
  status_changed: 'Status Changed',
  agent_event: 'Agent Event',
  performance_alert: 'Performance Alert',
}

interface FormData {
  [key: string]: NotificationTypePreference
}

export function NotificationPreferencesForm({ onSave }: NotificationPreferencesFormProps) {
  const { preferences, isLoading, isUpdating, updateError, updatePreferences, resetPreferences } = useNotificationPreferences()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Partial<NotificationPreferences> | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const form = useForm<FormData>({
    defaultValues: NOTIFICATION_TYPES.reduce(
      (acc, type) => {
        acc[type] = preferences?.[type as keyof NotificationPreferences] || {
          enabled: true,
          frequency: 'instant',
          channels: ['in-app'],
        }
        return acc
      },
      {} as FormData
    ),
    onSubmit: async ({ value }) => {
      const patch = NOTIFICATION_TYPES.reduce(
        (acc, type) => {
          acc[type as keyof NotificationPreferences] = value[type]
          return acc
        },
        {} as Partial<NotificationPreferences>
      )

      setPendingChanges(patch)
      updatePreferences(patch)
      setHasUnsavedChanges(false)
      setSuccessMessage('Preferences updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      onSave?.()
    },
  })

  // Sync form with preferences when loaded
  useEffect(() => {
    if (preferences) {
      NOTIFICATION_TYPES.forEach((type) => {
        form.setFieldValue(type, preferences[type as keyof NotificationPreferences])
      })
    }
  }, [preferences])

  const handleResetToDefaults = async () => {
    setIsResetting(true)
    try {
      await resetPreferences()
      setHasUnsavedChanges(false)
      setSuccessMessage('Preferences reset to defaults!')
      setTimeout(() => setSuccessMessage(null), 3000)
      onSave?.()
    } catch (error) {
      // Error will be shown in updateError from the hook
      const message = error instanceof Error ? error.message : 'Failed to reset preferences'
      setSuccessMessage(null)
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-slate-700 h-24 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!preferences) {
    return <div className="text-slate-400">Failed to load notification preferences</div>
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {updateError && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
          {updateError instanceof Error ? updateError.message : 'Failed to update preferences'}
        </div>
      )}

      {/* Notification Type Preferences */}
      <div className="space-y-4">
        {NOTIFICATION_TYPES.map((type) => (
          <NotificationTypeRow
            key={type}
            type={type}
            label={NOTIFICATION_LABELS[type]}
            form={form}
            onChangeDetected={() => setHasUnsavedChanges(true)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-slate-700">
        <button
          type="submit"
          disabled={isUpdating || !hasUnsavedChanges}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {isUpdating ? 'Saving...' : 'Save Preferences'}
        </button>
        {hasUnsavedChanges && (
          <button
            type="button"
            onClick={() => {
              // Reset form to original preferences
              NOTIFICATION_TYPES.forEach((type) => {
                form.setFieldValue(type, preferences[type as keyof NotificationPreferences])
              })
              setHasUnsavedChanges(false)
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={handleResetToDefaults}
          disabled={isUpdating || isResetting}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {isResetting ? 'Resetting...' : 'Reset to Defaults'}
        </button>
      </div>
    </form>
  )
}

interface NotificationTypeRowProps {
  type: string
  label: string
  form: ReturnType<typeof useForm<FormData>>
  onChangeDetected: () => void
}

function NotificationTypeRow({ type, label, form, onChangeDetected }: NotificationTypeRowProps) {
  const fieldValue = form.getFieldValue(type) as NotificationTypePreference

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-white mb-3">{label}</h4>

          {/* Frequency Toggle */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm text-slate-300">Frequency</label>
            <div className="flex gap-2">
              {(['instant', 'daily', 'off'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => {
                    form.setFieldValue(type, {
                      ...fieldValue,
                      frequency: freq,
                    })
                    onChangeDetected()
                  }}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    fieldValue.frequency === freq
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Checkboxes */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Channels</label>
            <div className="flex gap-4">
              {(['in-app', 'email'] as const).map((channel) => (
                <label key={channel} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldValue.channels.includes(channel)}
                    onChange={(e) => {
                      const newChannels = e.target.checked
                        ? [...fieldValue.channels, channel]
                        : fieldValue.channels.filter((c) => c !== channel)

                      form.setFieldValue(type, {
                        ...fieldValue,
                        channels: newChannels,
                      })
                      onChangeDetected()
                    }}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-300">
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
