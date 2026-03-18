import { useState, useEffect, useRef } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { NotificationBell } from './NotificationBell'
import { NotificationPanel } from './NotificationPanel'

/**
 * NotificationCenter - Main container for notification UI
 *
 * Features:
 * - Bell icon with unread count badge in header
 * - Slide-out drawer panel toggled by bell
 * - Integrates with useNotifications hook for 30s polling
 * - Respects notification preferences from useNotificationPreferences hook
 * - Keyboard accessible (Escape to close)
 * - Click-outside to close panel
 */
export default function NotificationCenter() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  const { notifications, unreadCount, isLoading, error, markAsRead, markMultipleAsRead } = useNotifications()
  const { data: preferences } = useNotificationPreferences()

  // Handle click outside panel
  useEffect(() => {
    if (!isPanelOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setIsPanelOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPanelOpen])

  // Handle Escape key
  useEffect(() => {
    if (!isPanelOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPanelOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isPanelOpen])

  // Restore focus when panel closes
  useEffect(() => {
    if (!isPanelOpen && bellRef.current) {
      bellRef.current.focus()
    }
  }, [isPanelOpen])

  return (
    <>
      <NotificationBell
        ref={bellRef}
        unreadCount={unreadCount}
        isOpen={isPanelOpen}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      />

      <NotificationPanel
        ref={panelRef}
        isOpen={isPanelOpen}
        notifications={notifications}
        isLoading={isLoading}
        error={error}
        unreadCount={unreadCount}
        preferences={preferences}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={async () => {
          const unreadIds = notifications
            .filter((n) => !n.read)
            .map((n) => n.id)
          if (unreadIds.length > 0) {
            await markMultipleAsRead(unreadIds)
          }
        }}
      />
    </>
  )
}
