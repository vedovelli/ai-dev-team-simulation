import { useCallback, useEffect, useRef, useState } from 'react'
import type { NotificationEventType } from '../../types/notification'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import { NotificationFilters, type NotificationTab } from './NotificationFilters'
import { NotificationList } from './NotificationList'
import { BulkActionBar } from './BulkActionBar'

export interface NotificationCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Full-featured Notification Center Modal
 *
 * Features:
 * - Modal overlay with backdrop
 * - Tab filtering: All / Unread / Archived
 * - Type filtering: assignment, sprint, task, deadline
 * - Virtual scrolling for 50+ notifications
 * - Selection checkboxes with select-all
 * - Bulk operations: mark as read, archive
 * - Keyboard navigation (Escape closes, Tab for focus management)
 * - ARIA accessibility
 * - Loading and empty states
 * - Real-time updates via useNotificationCenter
 */
export function NotificationCenterModal({ isOpen, onClose }: NotificationCenterModalProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')
  const [selectedType, setSelectedType] = useState<NotificationEventType | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const { notifications, unreadCount, isLoading, markAsRead, dismissMultiple } =
    useNotificationCenter()

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }

      // Focus trap with Tab
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [role="menuitem"], select, input[type="checkbox"]'
        ) as NodeListOf<HTMLElement>

        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Focus close button on open
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
      setSelectedIds(new Set())
    }
  }, [isOpen])

  // Filter notifications based on tab and type
  const displayedNotifications = notifications.filter((notification) => {
    // Tab filter
    if (activeTab === 'unread' && notification.read) {
      return false
    }

    // Type filter
    if (selectedType !== 'all' && (notification.eventType || notification.type) !== selectedType) {
      return false
    }

    return true
  })

  // Selection handlers
  const handleSelectionChange = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(displayedNotifications.map((n) => n.id)))
  }, [displayedNotifications])

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bulk action handlers
  const handleBulkMarkAsRead = useCallback(() => {
    Array.from(selectedIds).forEach((id) => {
      const notification = notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        markAsRead(id)
      }
    })
    setSelectedIds(new Set())
  }, [selectedIds, notifications, markAsRead])

  const handleBulkArchive = useCallback(() => {
    dismissMultiple(Array.from(selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds, dismissMultiple])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Modal Panel */}
      <div
        ref={modalRef}
        className={`
          fixed right-0 top-16 bottom-0 w-full max-w-md bg-white shadow-xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col border-l border-slate-200
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div>
            <h2 id="notification-center-title" className="font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <div
                className="inline-flex items-center gap-2 mt-2"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {unreadCount}
                </span>
                <span className="text-xs text-gray-500">unread</span>
              </div>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close notification center"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <NotificationFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        {/* List with Virtual Scrolling */}
        <NotificationList
          notifications={displayedNotifications}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onMarkAsRead={markAsRead}
          onArchive={(id) => dismissMultiple([id])}
          isLoading={isLoading}
          isEmpty={displayedNotifications.length === 0}
          emptyMessage={
            activeTab === 'unread'
              ? 'No unread notifications'
              : selectedType !== 'all'
                ? 'No notifications of this type'
                : 'No notifications yet'
          }
        />

        {/* Bulk Action Bar */}
        {displayedNotifications.length > 0 && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            totalCount={displayedNotifications.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onMarkAsRead={handleBulkMarkAsRead}
            onArchive={handleBulkArchive}
            isLoading={false}
          />
        )}
      </div>
    </>
  )
}
