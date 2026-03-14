/**
 * Frequency selector for a single notification type
 * Allows selecting between instant, daily, and off
 */

import type { NotificationFrequency } from '../../types/notification-preferences'

interface NotificationFrequencySelectProps {
  frequency: NotificationFrequency
  enabled: boolean
  onChange: (frequency: NotificationFrequency) => void
}

export function NotificationFrequencySelect({
  frequency,
  enabled,
  onChange,
}: NotificationFrequencySelectProps) {
  const frequencies: NotificationFrequency[] = ['instant', 'daily', 'off']

  return (
    <div className="flex gap-2">
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => onChange(freq)}
          disabled={!enabled}
          aria-label={`Set frequency to ${freq}`}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            frequency === freq ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          } ${!enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {freq.charAt(0).toUpperCase() + freq.slice(1)}
        </button>
      ))}
    </div>
  )
}
