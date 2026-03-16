import { useState, useCallback } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { NotificationList } from './NotificationList'
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

type ActiveTab = 'all' | 'unread' | 'preferences'

/**
 * NotificationCenter Modal
 *
 * Full-featured notification management modal with:
 * - Tabs: All / Unread / Preferences
 * - TanStack Table with sorting, filtering, pagination
 * - Bulk mark-as-read action
 * - Individual dismiss/read per notification
 * - Quick preference toggles inline
 * - Accessible with keyboard navigation and focus trap
 */
export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<Set<string>>(new Set())

  // Fetch all notifications
  const allNotifications = useNotifications({ unreadOnly: false })

  // Fetch unread notifications only
  const unreadNotifications = useNotifications({ unreadOnly: true })

  // Get preferences for quick toggles
  const preferences = useNotificationPreferences()

  // Determine which hook data to use based on active tab
  const currentNotifications = activeTab === 'unread' ? unreadNotifications : allNotifications

  const handleClose = () => {
    setSelectedNotificationIds(new Set())
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  // Mark selected notifications as read
  const handleMarkSelectedAsRead = useCallback(async () => {
    if (selectedNotificationIds.size === 0) return

    try {
      await allNotifications.markMultipleAsRead(Array.from(selectedNotificationIds))
      setSelectedNotificationIds(new Set())
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }, [selectedNotificationIds, allNotifications])

  // Toggle all notifications selection
  const handleToggleSelectAll = useCallback(() => {
    if (selectedNotificationIds.size === currentNotifications.notifications.length && selectedNotificationIds.size > 0) {
      setSelectedNotificationIds(new Set())
    } else {
      setSelectedNotificationIds(
        new Set(currentNotifications.notifications.map((n) => n.id))
      )
    }
  }, [currentNotifications.notifications, selectedNotificationIds])

  // Handle individual notification selection
  const handleToggleNotification = useCallback((id: string) => {
    setSelectedNotificationIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  if (!isOpen) return null

  const hasSelectableNotifications = currentNotifications.notifications.length > 0

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 id="notification-center-title" className="text-xl font-semibold text-gray-900">
              Notifications
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentNotifications.unreadCount} unread
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close notification center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-8 px-6 bg-gray-50">
          {(['all', 'unread', 'preferences'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setSelectedNotificationIds(new Set())
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
              {tab === 'unread' && currentNotifications.unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {currentNotifications.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'preferences' ? (
            <NotificationPreferencesPanel
              preferences={preferences}
              isLoading={preferences.isLoading}
            />
          ) : (
            <>
              {/* Bulk Actions Toolbar */}
              {hasSelectableNotifications && selectedNotificationIds.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-200">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedNotificationIds.size} selected
                  </span>
                  <button
                    onClick={handleMarkSelectedAsRead}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    Mark as read
                  </button>
                </div>
              )}

              <NotificationList
                notifications={currentNotifications.notifications}
                isLoading={currentNotifications.isLoading}
                isError={currentNotifications.isError}
                selectedIds={selectedNotificationIds}
                onToggleSelect={handleToggleNotification}
                onToggleSelectAll={handleToggleSelectAll}
                onMarkAsRead={allNotifications.markAsRead}
                onDismiss={allNotifications.dismissNotification}
                tab={activeTab}
                hasSelectableNotifications={hasSelectableNotifications}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
