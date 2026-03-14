import { useNavigate } from '@tanstack/react-router'
import { useNotifications } from '../../hooks/useNotifications'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  // Format badge text: show "99+" when count exceeds 99
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  // Dynamic aria-label for accessibility
  const ariaLabel =
    unreadCount === 0
      ? 'Notifications'
      : unreadCount === 1
        ? '1 unread notification'
        : `${unreadCount} unread notifications`

  const handleClick = () => {
    navigate({ to: '/notifications' })
  }

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      aria-label={ariaLabel}
    >
      {/* Bell icon */}
      <svg
        className="w-6 h-6 text-slate-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {badgeText}
        </span>
      )}
    </button>
  )
}
