import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

interface NotificationBadgeProps {
  /** Callback when bell icon is clicked */
  onClick: () => void
  /** Whether the notification dropdown panel is open */
  isOpen: boolean
}

/**
 * NotificationBadge component
 *
 * Displays a bell icon with an unread count badge.
 * Used to trigger the notification dropdown/panel.
 *
 * Features:
 * - Bell icon that toggles notification panel open/close
 * - Red badge showing unread count (caps at 99+)
 * - Active state styling when dropdown is open
 * - Accessible with aria-label and aria-pressed
 * - Keyboard accessible (Enter/Space to toggle)
 */
export function NotificationBadge({ onClick, isOpen }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications()

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        isOpen
          ? 'bg-slate-700 text-white'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      aria-pressed={isOpen}
      aria-expanded={isOpen}
    >
      <Bell className="w-5 h-5" />

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span
          className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
          aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
