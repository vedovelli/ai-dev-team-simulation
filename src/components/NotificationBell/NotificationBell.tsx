import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationCenterModal } from '../NotificationCenter/NotificationCenterModal'

/**
 * NotificationBell Component
 *
 * Displays a bell icon button with an unread count badge that opens the notification center modal.
 *
 * Features:
 * - Bell icon with unread count badge (hidden when 0)
 * - Pulse animation on badge (stops when modal opens, resets on new unread)
 * - Badge turns red for high-priority notifications
 * - Accessible: `aria-label` with unread count, keyboard operable
 * - Clicking opens the NotificationCenterModal
 * - Integrates with useNotifications hook for real-time data
 */
export function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [shouldPulse, setShouldPulse] = useState(unreadCount > 0)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(unreadCount)

  // Check if there are high-priority/urgent notifications
  const { notifications } = useNotifications()
  const hasUrgentNotifications = notifications.some((n) => n.priority === 'high')

  // Stop pulse when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setShouldPulse(false)
    }
  }, [isModalOpen])

  // Reset pulse when new unread notification arrives
  useEffect(() => {
    if (unreadCount > previousUnreadCount && !isModalOpen) {
      setShouldPulse(true)
    }
    setPreviousUnreadCount(unreadCount)
  }, [unreadCount, previousUnreadCount, isModalOpen])

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)
  const ariaLabel = `Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label={ariaLabel}
        aria-expanded={isModalOpen}
        aria-haspopup="dialog"
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />

        {/* Unread Badge - turns red for urgent notifications */}
        {unreadCount > 0 && (
          <span
            className={`absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full ${
              hasUrgentNotifications ? 'bg-red-500' : 'bg-red-500'
            } ${shouldPulse ? 'animate-pulse-badge' : ''}`}
            aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Notification Center Modal */}
      <NotificationCenterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
