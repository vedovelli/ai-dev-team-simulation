import type { NotificationTypePreference, NotificationChannel } from '../../../types/notification-preferences'

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

interface NotificationTypeRowProps {
  type: string
  preference: NotificationTypePreference
  onChange: (preference: NotificationTypePreference) => void
  isLoading?: boolean
  channelError?: string
}

export function NotificationTypeRow({
  type,
  preference,
  onChange,
  isLoading,
  channelError,
}: NotificationTypeRowProps) {
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...preference,
      frequency: e.target.value as 'instant' | 'daily' | 'off',
    })
  }

  const handleChannelToggle = (channel: NotificationChannel) => {
    const newChannels = preference.channels.includes(channel)
      ? preference.channels.filter((c) => c !== channel)
      : [...preference.channels, channel]

    onChange({
      ...preference,
      channels: newChannels,
    })
  }

  return (
    <div className="border-b border-slate-700 py-6 last:border-b-0">
      <div className="space-y-4">
        {/* Type label */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">
            {NOTIFICATION_TYPE_LABELS[type] || type}
          </label>
        </div>

        {/* Frequency and channels row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frequency select */}
          <div className="space-y-2">
            <label htmlFor={`freq-${type}`} className="block text-xs font-medium text-slate-300 uppercase">
              Frequency
            </label>
            <select
              id={`freq-${type}`}
              value={preference.frequency}
              onChange={handleFrequencyChange}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily Digest</option>
              <option value="off">Off</option>
            </select>
          </div>

          {/* Channel checkboxes */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300 uppercase">
              Channels
            </label>
            <div className="flex gap-4">
              {(['in-app', 'email'] as const).map((channel) => (
                <label key={channel} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preference.channels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                    disabled={isLoading}
                    className="w-4 h-4 bg-slate-800 border border-slate-600 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-slate-300 capitalize">
                    {channel === 'in-app' ? 'In-App' : 'Email'}
                  </span>
                </label>
              ))}
            </div>
            {channelError && (
              <p className="text-xs text-red-400 mt-1">{channelError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
