/**
 * Single notification preference row
 * Displays toggle, frequency selector, and channel controls for one notification type
 */

import type { NotificationTypePreference } from '../../types/notification-preferences'

export const PREFERENCE_LABELS: Record<string, { label: string; description: string }> = {
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

interface NotificationPreferenceRowProps {
  type: string
  preference: NotificationTypePreference
  onChange: (preference: NotificationTypePreference) => void
}

export function NotificationPreferenceRow({
  type,
  preference,
  onChange,
}: NotificationPreferenceRowProps) {
  const info = PREFERENCE_LABELS[type] || { label: type, description: '' }

  const handleToggle = () => {
    onChange({
      ...preference,
      enabled: !preference.enabled,
    })
  }

  const handleFrequencyChange = (frequency: NotificationTypePreference['frequency']) => {
    onChange({
      ...preference,
      frequency,
    })
  }

  const handleChannelToggle = (channel: 'in-app' | 'email') => {
    const channels = preference.channels.includes(channel)
      ? preference.channels.filter((c) => c !== channel)
      : [...preference.channels, channel]

    onChange({
      ...preference,
      channels,
    })
  }

  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <div className="space-y-3">
        {/* Type label and master toggle */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggle}
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
            {/* Frequency selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Frequency
              </label>
              <div className="flex gap-2">
                {(['instant', 'daily', 'off'] as const).map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleFrequencyChange(freq)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      preference.frequency === freq
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {freq === 'instant' ? 'Instant' : freq === 'daily' ? 'Daily Digest' : 'Off'}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel toggles */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Channels
              </label>
              <div className="flex gap-3">
                {(['in-app', 'email'] as const).map((channel) => (
                  <button
                    key={channel}
                    onClick={() => handleChannelToggle(channel)}
                    role="switch"
                    aria-checked={preference.channels.includes(channel)}
                    aria-label={`${info.label} via ${channel === 'in-app' ? 'In-App' : 'Email'}`}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      preference.channels.includes(channel) ? 'bg-green-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preference.channels.includes(channel) ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-600 flex items-center gap-2">
                  In-App{' '}
                  <span className="text-slate-400">|</span>{' '}
                  Email
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
