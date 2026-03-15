/**
 * Channel toggle for selecting in-app and email notification channels
 */

import type { NotificationChannel } from '../../types/notification-preferences'

interface ChannelToggleProps {
  channels: NotificationChannel[]
  enabled: boolean
  onChange: (channels: NotificationChannel[]) => void
}

export function ChannelToggle({
  channels,
  enabled,
  onChange,
}: ChannelToggleProps) {
  const CHANNELS: NotificationChannel[] = ['in-app', 'email']

  const handleToggle = (channel: NotificationChannel) => {
    const newChannels = channels.includes(channel)
      ? channels.filter((c) => c !== channel)
      : [...channels, channel]
    onChange(newChannels)
  }

  return (
    <div className="flex gap-3">
      {CHANNELS.map((channel) => (
        <button
          key={channel}
          onClick={() => handleToggle(channel)}
          disabled={!enabled}
          role="switch"
          aria-checked={channels.includes(channel)}
          aria-label={`Toggle ${channel} notifications`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            channels.includes(channel) ? 'bg-green-600' : 'bg-slate-300'
          } ${!enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              channels.includes(channel) ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
