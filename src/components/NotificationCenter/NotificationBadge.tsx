import { Bell } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

interface NotificationBadgeProps {
  /** Number of unread notifications */
  unreadCount: number
  /** Callback when bell icon is clicked */
  onClick: () => void
  /** Whether the notification dropdown panel is open */
  isOpen?: boolean
  /** Whether notifications are loading */
  isLoading?: boolean
  /** Optional CSS class name for styling */
  className?: string
}

/**
 * NotificationBadge component
 *
 * Displays a bell icon with an unread count badge.
 * Used to trigger the notification dropdown/panel.
 * This is a presentational component - the parent manages state via useNotificationCenter.
 *
 * Features:
 * - Bell icon that toggles notification panel open/close
 * - Red badge showing unread count (caps at 99+)
 * - Animated pulse indicator when new notifications arrive
 * - Active state styling when dropdown is open
 * - Loading skeleton state while fetching
 * - Accessible with aria-label and aria-pressed
 * - Keyboard accessible (Enter/Space to toggle)
 */
export function NotificationBadge({
  unreadCount,
  onClick,
  isOpen = false,
  isLoading = false,
  className = '',
}: NotificationBadgeProps) {
  const prevCountRef = useRef(unreadCount)
  const [showPulse, setShowPulse] = useState(false)

  // Trigger pulse animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 2000)
      return () => clearTimeout(timer)
    }
    prevCountRef.current = unreadCount
  }, [unreadCount])

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount)
  const showBadge = unreadCount > 0

  const ariaLabel =
    unreadCount === 0
      ? 'Notifications'
      : unreadCount === 1
        ? '1 unread notification'
        : `${unreadCount} unread notifications`

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
        isLoading
          ? 'opacity-50 cursor-not-allowed'
          : isOpen
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      } ${className}`}
      aria-label={ariaLabel}
      aria-pressed={showBadge}
      aria-expanded={isOpen}
      type="button"
    >
      <Bell className="w-5 h-5" />

      {/* Animated pulse dot when new notifications arrive */}
      {showPulse && showBadge && (
        <span
          className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Unread Count Badge */}
      {showBadge && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
          {displayCount}
        </span>
      )}

      {/* Loading skeleton state */}
      {isLoading && !showBadge && (
        <span
          className="absolute inset-0 rounded-lg bg-slate-700 animate-pulse"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
