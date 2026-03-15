/**
 * Single notification preference row
 * Displays toggle, frequency selector, and channel controls for one notification type
 */

import type { NotificationTypePreference } from '../../types/notification-preferences'
import { NotificationFrequencySelect } from './NotificationFrequencySelect'
import { ChannelToggle } from './ChannelToggle'

export const PREFERENCE_LABELS: Record<string, string> = {
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

interface PreferenceRowProps {
  type: string
  preference: NotificationTypePreference
  onChange: (preference: NotificationTypePreference) => void
}

export function PreferenceRow({
  type,
  preference,
  onChange,
}: PreferenceRowProps) {
  const handleToggle = () => {
    onChange({
      ...preference,
      enabled: !preference.enabled,
    })
  }

  const handleFrequencyChange = (frequency: typeof preference.frequency) => {
    onChange({
      ...preference,
      frequency,
    })
  }

  const handleChannelsChange = (channels: typeof preference.channels) => {
    onChange({
      ...preference,
      channels,
    })
  }

  const label = PREFERENCE_LABELS[type] || type

  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <div className="space-y-3">
        {/* Preference type label and main toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            role="switch"
            aria-checked={preference.enabled}
            aria-label={`Toggle ${label}`}
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
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        </div>

        {/* Frequency and channel controls - shown only when enabled */}
        {preference.enabled && (
          <div className="ml-14 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Frequency
              </label>
              <NotificationFrequencySelect
                frequency={preference.frequency}
                enabled={preference.enabled}
                onChange={handleFrequencyChange}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Channels
              </label>
              <ChannelToggle
                channels={preference.channels}
                enabled={preference.enabled}
                onChange={handleChannelsChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
