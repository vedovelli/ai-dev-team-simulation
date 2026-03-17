/**
 * Single notification type row with toggle, frequency dropdown, and channel controls
 * Used within TanStack Form for form state management
 */

import type { FieldApi } from '@tanstack/react-form'
import type { NotificationPreferences, NotificationTypePreference } from '../../types/notification-preferences'

const PREFERENCE_LABELS: Record<string, { label: string; description: string }> = {
  assignment_changed: { label: 'Assignment Changed', description: 'When your assignment status changes' },
  sprint_updated: { label: 'Sprint Updated', description: 'When sprint details are updated' },
  task_reassigned: { label: 'Task Reassigned', description: 'When a task is reassigned' },
  deadline_approaching: { label: 'Deadline Approaching', description: 'When a deadline is approaching' },
  task_assigned: { label: 'Task Assigned', description: 'When a task is assigned to you' },
  task_unassigned: { label: 'Task Unassigned', description: 'When a task is unassigned' },
  sprint_started: { label: 'Sprint Started', description: 'When a sprint starts' },
  sprint_completed: { label: 'Sprint Completed', description: 'When a sprint is completed' },
  comment_added: { label: 'Comment Added', description: 'When comments are added' },
  status_changed: { label: 'Status Changed', description: 'When status changes' },
  agent_event: { label: 'Agent Event', description: 'Agent activity notifications' },
  performance_alert: { label: 'Performance Alert', description: 'Performance-related alerts' },
}

interface NotificationTypeRowProps {
  type: string
  field: FieldApi<
    Partial<NotificationPreferences>,
    string,
    NotificationTypePreference | undefined,
    NotificationTypePreference | undefined
  >
}

export function NotificationTypeRow({ type, field }: NotificationTypeRowProps) {
  const preference = field.state.value || {
    enabled: true,
    frequency: 'instant' as const,
    channels: ['in-app'] as const,
  }

  const info = PREFERENCE_LABELS[type] || { label: type, description: '' }

  const handleToggleEnabled = () => {
    field.setValue({
      ...preference,
      enabled: !preference.enabled,
    })
  }

  const handleFrequencyChange = (frequency: NotificationTypePreference['frequency']) => {
    field.setValue({
      ...preference,
      frequency,
    })
  }

  const handleChannelToggle = (channel: 'in-app' | 'email') => {
    const channels = preference.channels.includes(channel)
      ? preference.channels.filter((c) => c !== channel)
      : [...preference.channels, channel]

    field.setValue({
      ...preference,
      channels,
    })
  }

  return (
    <div className="border-b border-slate-200 py-4 px-4 last:border-b-0">
      <div className="space-y-3">
        {/* Type label and master toggle */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleToggleEnabled}
            role="switch"
            aria-checked={preference.enabled}
            aria-label={`Toggle ${info.label}`}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              preference.enabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preference.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700 cursor-pointer">
              {info.label}
            </label>
            {info.description && (
              <p className="text-xs text-slate-500 mt-1">{info.description}</p>
            )}
          </div>
        </div>

        {/* Frequency and channel controls - shown only when enabled */}
        {preference.enabled && (
          <div className="ml-14 space-y-3">
            {/* Frequency dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Frequency
              </label>
              <select
                value={preference.frequency}
                onChange={(e) => handleFrequencyChange(e.target.value as NotificationTypePreference['frequency'])}
                className="px-3 py-1.5 text-sm rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily Digest</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Channel toggles */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Channels
              </label>
              <div className="flex gap-4">
                {(['in-app', 'email'] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => handleChannelToggle(channel)}
                    role="switch"
                    aria-checked={preference.channels.includes(channel)}
                    aria-label={`${info.label} via ${channel === 'in-app' ? 'In-App' : 'Email'}`}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      preference.channels.includes(channel)
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={preference.channels.includes(channel)}
                      readOnly
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span>{channel === 'in-app' ? 'In-App' : 'Email'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
