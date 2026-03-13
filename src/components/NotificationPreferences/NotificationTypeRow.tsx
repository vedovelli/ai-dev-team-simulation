import type { NotificationTypePreference, NotificationFrequency } from '../../types/notification-preferences'

interface NotificationTypeRowProps {
  type: NotificationTypePreference
  label: string
  frequency: NotificationFrequency
  hasInApp: boolean
  hasEmail: boolean
  onFrequencyChange: (type: NotificationTypePreference, frequency: NotificationFrequency) => void
  onInAppToggle: (type: NotificationTypePreference, enabled: boolean) => void
  onEmailToggle: (type: NotificationTypePreference, enabled: boolean) => void
  disabled?: boolean
}

export function NotificationTypeRow({
  type,
  label,
  frequency,
  hasInApp,
  hasEmail,
  onFrequencyChange,
  onInAppToggle,
  onEmailToggle,
  disabled = false,
}: NotificationTypeRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 py-4 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasInApp}
            onChange={(e) => onInAppToggle(type, e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <span className="text-xs text-gray-600">In-App</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasEmail}
            onChange={(e) => onEmailToggle(type, e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <span className="text-xs text-gray-600">Email</span>
        </label>

        <select
          value={frequency}
          onChange={(e) => onFrequencyChange(type, e.target.value as NotificationFrequency)}
          disabled={disabled}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="instant">Instant</option>
          <option value="daily">Daily</option>
          <option value="off">Off</option>
        </select>
      </div>
    </div>
  )
}
