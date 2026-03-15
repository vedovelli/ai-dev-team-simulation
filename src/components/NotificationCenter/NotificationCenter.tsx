'use client'

import React, { useCallback } from 'react'
import { AlertCircle, X, Check, RefreshCw } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

/**
 * NotificationCenter component
 *
 * Displays real-time notifications fetched via useNotifications() hook.
 * Features:
 * - Loading state with skeleton items
 * - Error state with retry button
 * - Empty state when no notifications
 * - Mark all as read / Clear all actions
 * - Unread count badge in header
 * - Responsive layout
 */
export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead,
    markMultipleAsRead,
    dismissNotification,
    dismissAllReadNotifications,
  } = useNotifications()

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id)

    if (unreadIds.length > 0) {
      await markMultipleAsRead(unreadIds)
    }
  }, [notifications, markMultipleAsRead])

  const handleDismissNotification = useCallback((id: string) => {
    dismissNotification(id)
  }, [dismissNotification])

  const handleClearAllRead = useCallback(() => {
    dismissAllReadNotifications()
  }, [dismissAllReadNotifications])

  // Loading state
  if (isLoading && notifications.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Loading skeleton */}
          <div className="divide-y divide-slate-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 sm:px-6 py-4 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-slate-200 rounded animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            </div>
          </div>

          {/* Error banner */}
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-900">Failed to load notifications</h3>
                <p className="text-sm text-red-700 mt-1">
                  {error instanceof Error ? error.message : 'An error occurred while fetching notifications'}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                0
              </span>
            </div>
          </div>

          {/* Empty state */}
          <div className="px-4 sm:px-6 py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">All caught up!</h3>
            <p className="text-sm text-slate-500">You have no new notifications</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {unreadCount}
            </span>
          </div>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-slate-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className="flex-shrink-0 mt-1">
                  {!notification.read ? (
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-slate-300" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                        {notification.type && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">
                            {formatNotificationType(notification.type)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissNotification(notification.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with actions */}
        {(unreadCount > 0 || notifications.some((n) => n.read)) && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
              >
                Mark all as read
              </button>
            )}
            {notifications.some((n) => n.read) && (
              <button
                onClick={handleClearAllRead}
                className="text-sm font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors ml-auto"
              >
                Clear read
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Format ISO timestamp to relative time (e.g., "5m ago")
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

/**
 * Format notification type to human-readable label
 */
function formatNotificationType(type: string): string {
  const labels: Record<string, string> = {
    'task_assigned': 'Task Assigned',
    'task_unassigned': 'Task Unassigned',
    'sprint_started': 'Sprint Started',
    'sprint_completed': 'Sprint Completed',
    'comment_added': 'Comment Added',
    'status_changed': 'Status Changed',
    'agent_event': 'Agent Event',
    'performance_alert': 'Performance Alert',
    'assignment_changed': 'Assignment Changed',
    'sprint_updated': 'Sprint Updated',
    'task_reassigned': 'Task Reassigned',
    'deadline_approaching': 'Deadline Approaching',
  }
  return labels[type] || type
}
