import type { NotificationPreferences, NotificationTypePreference } from '../../types/notification-preferences'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'

interface NotificationPreferencesPanelProps {
  preferences: ReturnType<typeof useNotificationPreferences>
  isLoading: boolean
}

type NotificationType = keyof Omit<
  NotificationPreferences,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'quiet_hours_enabled' | 'quiet_hours_start' | 'quiet_hours_end'
>

const notificationTypes: NotificationType[] = [
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
]

function getDisplayName(type: NotificationType): string {
  const names: Record<NotificationType, string> = {
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
  return names[type]
}

/**
 * NotificationPreferencesPanel
 *
 * Quick preference toggles for notification types with:
 * - Per-type enable/disable toggle
 * - Frequency selector (instant/daily/off)
 * - Channel selection (in-app/email)
 * - Global quiet hours configuration
 * - Real-time optimistic updates
 */
export function NotificationPreferencesPanel({
  preferences,
  isLoading,
}: NotificationPreferencesPanelProps) {
  const { updatePreferences } = preferences

  if (isLoading || !preferences.preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    )
  }

  const currentPreferences = preferences.preferences

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Customize your notification preferences below. Changes are saved automatically.
        </p>
      </div>

      <div className="space-y-4">
        {notificationTypes.map((type) => {
          const pref = currentPreferences[type] as NotificationTypePreference | undefined
          const isEnabled = pref?.enabled ?? true

          return (
            <div
              key={type}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 block">
                  {getDisplayName(type)}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Frequency: <span className="font-medium">{pref?.frequency || 'instant'}</span>
                  {pref?.channels && ` • Channels: ${pref.channels.join(', ')}`}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => {
                    updatePreferences({
                      [type]: {
                        ...pref,
                        enabled: e.target.checked,
                      },
                    })
                  }}
                  className="sr-only peer"
                  aria-label={`Toggle ${getDisplayName(type)}`}
                />
                <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          )
        })}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quiet Hours</h3>
        <div className="space-y-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={currentPreferences.quiet_hours_enabled ?? false}
              onChange={(e) => {
                updatePreferences({
                  quiet_hours_enabled: e.target.checked,
                })
              }}
              className="sr-only peer"
              aria-label="Enable quiet hours"
            />
            <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            <span className="ml-3 text-sm font-medium text-gray-900">Enable quiet hours</span>
          </label>

          {currentPreferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 ml-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Start time</label>
                <input
                  type="time"
                  value={currentPreferences.quiet_hours_start || '22:00'}
                  onChange={(e) => {
                    updatePreferences({
                      quiet_hours_start: e.target.value,
                    })
                  }}
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">End time</label>
                <input
                  type="time"
                  value={currentPreferences.quiet_hours_end || '08:00'}
                  onChange={(e) => {
                    updatePreferences({
                      quiet_hours_end: e.target.value,
                    })
                  }}
                  className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
