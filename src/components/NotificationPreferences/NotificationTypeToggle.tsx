/**
 * Single notification type preference row
 * Displays toggle, frequency selector, and channel controls for one notification type
 */

import type { NotificationTypePreference, NotificationChannel } from '../../types/notification-preferences'
import { NotificationFrequencySelect } from './NotificationFrequencySelect'

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
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

interface NotificationTypeToggleProps {
  type: string
  preference: NotificationTypePreference
  onChange: (preference: NotificationTypePreference) => void
}

export function NotificationTypeToggle({
  type,
  preference,
  onChange,
}: NotificationTypeToggleProps) {
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

  const handleChannelToggle = (channel: NotificationChannel) => {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Type label and master toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            role="switch"
            aria-checked={preference.enabled}
            aria-label={`Toggle ${NOTIFICATION_TYPE_LABELS[type]} notifications`}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              preference.enabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preference.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <label className="text-sm font-medium text-slate-700 cursor-pointer">
            {NOTIFICATION_TYPE_LABELS[type]}
          </label>
        </div>

        {/* Frequency selector */}
        <NotificationFrequencySelect
          frequency={preference.frequency}
          enabled={preference.enabled}
          onChange={handleFrequencyChange}
        />

        {/* Channel toggles */}
        <div className="flex gap-3">
          {(['in-app', 'email'] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => handleChannelToggle(channel)}
              disabled={!preference.enabled}
              role="switch"
              aria-checked={preference.channels.includes(channel)}
              aria-label={`${NOTIFICATION_TYPE_LABELS[type]} via ${channel}`}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                preference.channels.includes(channel) ? 'bg-green-600' : 'bg-slate-300'
              } ${!preference.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preference.channels.includes(channel) ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
