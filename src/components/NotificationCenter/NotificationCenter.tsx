'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import { NotificationBadge } from './NotificationBadge'
import { NotificationList } from './NotificationList'

interface NotificationCenterProps {
  /** Container className for positioning */
  className?: string
}

/**
 * NotificationCenter component
 *
 * Main container for notification dropdown/panel UI.
 * Orchestrates notification center state via useNotificationCenter hook.
 * Manages the bell icon, unread count badge, and dropdown panel state.
 *
 * Features:
 * - Bell icon with unread count badge (reactive to unread count changes)
 * - Dropdown panel opens on click (toggle behavior)
 * - Closes on Escape key and outside click
 * - Scrollable notification list with max-height
 * - Mark all as read button with proper cache invalidation
 * - Individual notification mark-as-read and dismiss
 * - Empty and loading states
 * - Keyboard navigation with focus trap
 * - Accessible with ARIA attributes
 * - Cache synchronization across notifications and preferences queries
 */
export function NotificationCenter({ className = '' }: NotificationCenterProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    isOpen,
    toggleDropdown,
    closeDropdown,
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refetch,
  } = useNotificationCenter()

  const isError = error !== null

  // Toggle dropdown open/close from hook
  const handleToggle = useCallback(() => {
    toggleDropdown()
  }, [toggleDropdown])

  // Close dropdown from hook
  const handleClose = useCallback(() => {
    closeDropdown()
  }, [closeDropdown])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, handleClose])

  // Close on Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      // Focus trap: cycle through focusable elements within panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll(
          'button, a, [tabindex]:not([tabindex="-1"])'
        )
        const focusArray = Array.from(focusableElements) as HTMLElement[]

        if (focusArray.length === 0) return

        const currentFocus = document.activeElement
        const focusedIndex = focusArray.indexOf(currentFocus as HTMLElement)

        if (e.shiftKey) {
          // Shift + Tab - move to previous focusable element
          if (focusedIndex <= 0) {
            e.preventDefault()
            focusArray[focusArray.length - 1].focus()
          }
        } else {
          // Tab - move to next focusable element
          if (focusedIndex === focusArray.length - 1) {
            e.preventDefault()
            focusArray[0].focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Mark all as read uses hook mutation
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead()
  }, [markAllAsRead])

  const handleMarkAsReadSingle = useCallback((id: string) => {
    markAsRead(id)
  }, [markAsRead])

  const handleDismissNotification = useCallback((id: string) => {
    dismissNotification(id)
  }, [dismissNotification])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Bell icon badge button */}
      <NotificationBadge onClick={handleToggle} isOpen={isOpen} />

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg border border-slate-200 shadow-xl z-50 max-h-[600px] flex flex-col"
          role="dialog"
          aria-label="Notifications"
          aria-modal="true"
        >
          {/* Header with unread count and mark all as read */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && !isLoading && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                aria-label="Mark all notifications as read"
              >
                Mark all as read
              </button>
            )}
            {unreadCount === 0 && !isLoading && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {notifications.length}
              </span>
            )}
          </div>

          {/* Error state */}
          {isError && (
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-900">Failed to load</p>
                  <p className="text-xs text-red-700 mt-1">
                    {error instanceof Error ? error.message : 'An error occurred'}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label="Retry loading notifications"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification list */}
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={isError ? error : null}
            onMarkAsRead={handleMarkAsReadSingle}
            onDismiss={handleDismissNotification}
            emptyMessage="You're all caught up!"
          />
        </div>
      )}
    </div>
  )
}
