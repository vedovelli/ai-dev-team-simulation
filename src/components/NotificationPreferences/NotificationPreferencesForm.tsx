import { useEffect, useState } from 'react'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import type { NotificationTypePreference, NotificationTypePreferences, NotificationFrequency } from '../../types/notification-preferences'
import { NotificationTypeRow } from './NotificationTypeRow'

const NOTIFICATION_TYPE_LABELS: Record<NotificationTypePreference, string> = {
  task_assigned: 'Task Assigned',
  task_unassigned: 'Task Unassigned',
  sprint_started: 'Sprint Started',
  sprint_completed: 'Sprint Completed',
  comment_added: 'Comment Added',
  status_changed: 'Status Changed',
  agent_event: 'Agent Event',
  performance_alert: 'Performance Alert',
  assignment_changed: 'Assignment Changed',
  sprint_updated: 'Sprint Updated',
  task_reassigned: 'Task Reassigned',
  deadline_approaching: 'Deadline Approaching',
}

interface LocalPreferences {
  enabled: boolean
  globalFrequency: NotificationFrequency
  types: NotificationTypePreferences[]
}

export function NotificationPreferencesForm(): JSX.Element {
  const { preferences, isLoading, isUpdating, updateError, updatePreferences, resetPreferences } =
    useNotificationPreferences()

  const [localPrefs, setLocalPrefs] = useState<LocalPreferences | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  // Initialize local preferences when data loads
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        enabled: preferences.enabled,
        globalFrequency: 'instant',
        types: [...preferences.types],
      })
      setSubmitSuccess(false)
      setSubmitError(null)
    }
  }, [preferences])

  // Handle update error
  useEffect(() => {
    if (updateError) {
      setSubmitError(updateError.message)
    }
  }, [updateError])

  if (isLoading || !localPrefs) {
    return <div className="text-sm text-gray-500">Loading preferences...</div>
  }

  const handleMasterToggle = (enabled: boolean) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        enabled,
        types: prev.types.map((t) => ({
          ...t,
          channels: enabled ? t.channels : [],
        })),
      }
    })
  }

  const handleGlobalFrequencyChange = (frequency: NotificationFrequency) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        globalFrequency: frequency,
        types: prev.types.map((t) => ({
          ...t,
          frequency,
        })),
      }
    })
  }

  const handleFrequencyChange = (type: NotificationTypePreference, frequency: NotificationFrequency) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        types: prev.types.map((t) => (t.type === type ? { ...t, frequency } : t)),
      }
    })
  }

  const handleInAppToggle = (type: NotificationTypePreference, enabled: boolean) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        types: prev.types.map((t) => {
          if (t.type === type) {
            const newChannels = enabled ? [...t.channels, 'in-app'] : t.channels.filter((c) => c !== 'in-app')
            return { ...t, channels: newChannels as Array<'in-app' | 'email'> }
          }
          return t
        }),
      }
    })
  }

  const handleEmailToggle = (type: NotificationTypePreference, enabled: boolean) => {
    setLocalPrefs((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        types: prev.types.map((t) => {
          if (t.type === type) {
            const newChannels = enabled ? [...t.channels, 'email'] : t.channels.filter((c) => c !== 'email')
            return { ...t, channels: newChannels as Array<'in-app' | 'email'> }
          }
          return t
        }),
      }
    })
  }

  const handleSave = () => {
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!localPrefs) return

    try {
      updatePreferences({
        enabled: localPrefs.enabled,
        types: localPrefs.types,
      })
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save preferences')
    }
  }

  const handleReset = async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    setIsResetting(true)

    try {
      await resetPreferences()
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to reset preferences')
    } finally {
      setIsResetting(false)
    }
  }

  const isFormDisabled = isUpdating || isLoading || isResetting

  return (
    <div className="space-y-6">
      {submitSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          {isResetting ? 'Preferences reset to defaults successfully!' : 'Preferences saved successfully!'}
        </div>
      )}

      {submitError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{submitError}</div>
      )}

      {/* Global Controls */}
      <fieldset disabled={isFormDisabled} className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Global Controls</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localPrefs.enabled}
                onChange={(e) => handleMasterToggle(e.target.checked)}
                disabled={isFormDisabled}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <span className="text-sm font-medium text-gray-900">Enable all notifications</span>
            </label>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">Global Frequency</label>
              <select
                value={localPrefs.globalFrequency}
                onChange={(e) => handleGlobalFrequencyChange(e.target.value as NotificationFrequency)}
                disabled={isFormDisabled || !localPrefs.enabled}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Per-Type Controls */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Notification Type Preferences</h3>

          <div className="space-y-1">
            {localPrefs.types.map((typePref) => (
              <NotificationTypeRow
                key={typePref.type}
                type={typePref.type}
                label={NOTIFICATION_TYPE_LABELS[typePref.type]}
                frequency={typePref.frequency}
                hasInApp={typePref.channels.includes('in-app')}
                hasEmail={typePref.channels.includes('email')}
                onFrequencyChange={handleFrequencyChange}
                onInAppToggle={handleInAppToggle}
                onEmailToggle={handleEmailToggle}
                disabled={isFormDisabled || !localPrefs.enabled}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isFormDisabled}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isFormDisabled}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </button>
        </div>
      </fieldset>
    </div>
  )
}
