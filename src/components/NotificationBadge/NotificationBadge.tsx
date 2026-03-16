import { useNotifications } from '../../hooks/useNotifications'

export interface NotificationBadgeProps {
  /**
   * Callback fired when badge is clicked to open Notification Center
   */
  onClick?: () => void
  /**
   * Optional CSS class name for styling
   */
  className?: string
}

/**
 * NotificationBadge Component
 *
 * Displays a notification bell icon with an animated indicator and unread count badge.
 * Provides the entry point for users to open the Notification Center modal.
 *
 * Features:
 * - Renders bell icon with count bubble
 * - Reads unread count from useNotifications hook
 * - Animated pulse dot when there are new unread notifications
 * - Count bubble shows "9+" for counts above 9
 * - Zero-count state: badge hidden when no unread notifications
 * - Loading state: disabled bell during data fetch
 * - Fully accessible with proper ARIA labels
 * - Keyboard accessible: Enter/Space to trigger onClick
 * - Responsive and mobile-friendly
 * - Tailwind CSS styling
 */
export function NotificationBadge({
  onClick,
  className = '',
}: NotificationBadgeProps) {
  const { unreadCount, isLoading } = useNotifications()

  // Format badge text: show "9+" when count exceeds 9
  const displayCount = unreadCount > 9 ? '9+' : String(unreadCount)

  // Determine if badge should be visible (only show when there are unread notifications)
  const showBadge = unreadCount > 0

  // Determine if button should be disabled (while loading notifications)
  const isDisabled = isLoading

  // Dynamic aria-label for accessibility
  const ariaLabel =
    unreadCount === 0
      ? 'Notifications'
      : unreadCount === 1
        ? '1 unread notification'
        : `${unreadCount} unread notifications`

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 min-h-11 min-w-11 ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      } ${className}`}
      aria-label={ariaLabel}
      aria-pressed={showBadge}
      type="button"
    >
      {/* Bell icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread count badge with pulse animation - only show when unreadCount > 0 */}
      {showBadge && (
        <>
          {/* Animated pulse dot for visual alert */}
          <span
            className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse"
            aria-hidden="true"
          />

          {/* Count bubble showing unread notifications */}
          <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {displayCount}
          </span>
        </>
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
