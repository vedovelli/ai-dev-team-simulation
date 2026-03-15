import { useRef, useEffect, useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-5 h-5 bg-slate-700 rounded animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    dismissNotification,
    markMultipleAsRead,
  } = useNotifications()

  // Refetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refetch()
    }
  }, [isOpen, refetch])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col max-h-[600px]"
      role="dialog"
      aria-label="Notifications"
      aria-modal="false"
    >
      {/* Header */}
      <div className="border-b border-slate-700 px-4 py-3 flex items-center justify-between bg-slate-900/80 rounded-t-lg sticky top-0 z-10">
        <h2 className="text-sm font-semibold text-slate-200">Notifications</h2>

        {/* Filter Tabs */}
        <div className="flex gap-2" role="tablist">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                filter === tab
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              role="tab"
              aria-selected={filter === tab}
              aria-label={`Show ${tab} notifications`}
            >
              {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && filteredNotifications.length === 0 ? (
          <LoadingSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <svg
              className="w-12 h-12 text-slate-600 mx-auto mb-2"
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
            <p className="text-slate-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div role="list" className="divide-y divide-slate-700">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismissNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-700 px-4 py-3 bg-slate-900/80 rounded-b-lg sticky bottom-0">
          <button
            onClick={() => markMultipleAsRead(notifications.filter((n) => !n.read).map((n) => n.id))}
            disabled={unreadCount === 0}
            className="w-full px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Mark all notifications as read"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  )
}
