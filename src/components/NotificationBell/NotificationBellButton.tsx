import { useEffect, useState } from 'react'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import { NotificationDropdown } from '../NotificationDropdown'

/**
 * NotificationBellButton Component
 *
 * Combines a notification bell icon with a dropdown panel showing the 20 most recent notifications.
 * Manages its own local dropdown state independent of the full NotificationCenter modal.
 *
 * Features:
 * - Bell icon with animated badge showing unread count
 * - Local dropdown state managed with useState (not context-dependent)
 * - Dropdown opens/closes on bell click
 * - Dropdown closes on outside click and Escape key
 * - Shows 20 most recent notifications
 * - Animated pulse on new notifications
 * - Unread count badge (capped at "99+")
 * - Accessible with aria-label and aria-expanded
 * - Responsive touch target (44x44px minimum on mobile)
 */
export function NotificationBellButton() {
  const { unreadCount } = useNotificationCenter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [prevCount, setPrevCount] = useState(unreadCount)
  const [showPulse, setShowPulse] = useState(false)

  // Trigger pulse animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevCount) {
      setShowPulse(true)
      const timer = setTimeout(() => setShowPulse(false), 1000)
      return () => clearTimeout(timer)
    }
    setPrevCount(unreadCount)
  }, [unreadCount, prevCount])

  // Format badge text: show "99+" when count exceeds 99
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  // Dynamic aria-label for accessibility
  const ariaLabel =
    unreadCount === 0
      ? 'Notifications'
      : unreadCount === 1
        ? '1 unread notification'
        : `${unreadCount} unread notifications`

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={`relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 min-h-11 min-w-11 sm:min-h-12 sm:min-w-12 flex items-center justify-center ${
          isDropdownOpen
            ? 'bg-slate-800 text-blue-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        aria-label={ariaLabel}
        aria-expanded={isDropdownOpen}
      >
        {/* Bell icon */}
        <svg
          className="w-6 h-6 transition-transform duration-200"
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

        {/* Unread count badge with pulse animation */}
        {unreadCount > 0 && (
          <>
            {/* Pulse ring effect when new notification arrives */}
            {showPulse && (
              <span
                className="absolute inset-0 rounded-full bg-red-600 animate-ping"
                aria-hidden="true"
              />
            )}

            {/* Badge count */}
            <span
              className={`absolute top-0 right-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full transition-all duration-200 ${
                showPulse ? 'scale-110' : 'scale-100'
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {badgeText}
            </span>
          </>
        )}
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={closeDropdown}
      />
    </div>
  )
}
