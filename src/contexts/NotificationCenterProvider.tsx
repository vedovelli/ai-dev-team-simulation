import React, { createContext, useState, useCallback, useMemo } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences'
import type { Notification, NotificationFilter } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import type { TransportConfig } from '../types/notification-transport'

/**
 * Context value shape for NotificationCenter
 */
export interface NotificationCenterContextValue {
  // Notification data
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null

  // Filtered views
  filteredNotifications: Notification[]
  activeFilter: NotificationFilter
  setFilter: (filter: NotificationFilter) => void

  // Actions
  markAsRead: (id: string) => void
  markMultipleAsRead: (ids: string[]) => Promise<Notification[]>
  markAllAsRead: () => Promise<Notification[]>
  dismissNotification: (id: string) => Promise<void>

  // Preferences
  preferences: NotificationPreferences | undefined
  updatePreferences: (patch: Record<string, unknown>) => void
  preferencesLoading: boolean

  // UI state
  isPanelOpen: boolean
  togglePanel: () => void
  closePanel: () => void
  openPanel: () => void
}

const NotificationCenterContext = createContext<NotificationCenterContextValue | undefined>(undefined)

interface NotificationCenterProviderProps {
  children: React.ReactNode
  /**
   * Optional transport configuration for notification delivery
   * Defaults to PollingTransport if not provided
   *
   * Future: will allow swapping to WebSocketTransport for real-time delivery
   */
  transportConfig?: TransportConfig
}

/**
 * Provider that wraps notification hooks and exposes a clean interface
 *
 * Features:
 * - Centralizes notification state management
 * - Provides filtering (all, unread, by type)
 * - Panel open/close state
 * - Preferences management
 * - Pluggable transport layer (polling, WebSocket, etc.)
 */
export function NotificationCenterProvider({
  children,
  transportConfig,
}: NotificationCenterProviderProps) {
  // TODO: Integrate transportConfig into useNotifications hook
  // This will allow swapping transport implementations at runtime
  // Currently unused but ready for future WebSocket integration
  void transportConfig

  const notificationsHook = useNotifications()
  const preferencesHook = useNotificationPreferences()

  // UI state
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Filter state
  const [activeFilter, setFilter] = useState<NotificationFilter>('all')

  /**
   * Filter notifications based on active filter
   */
  const filteredNotifications = useMemo(() => {
    const { notifications } = notificationsHook

    switch (activeFilter) {
      case 'all':
        return notifications
      case 'unread':
        return notifications.filter((notif) => !notif.read)
      default:
        // Filter by type
        return notifications.filter((notif) => notif.type === activeFilter)
    }
  }, [notificationsHook.notifications, activeFilter])

  /**
   * Mark all unread notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notificationsHook.notifications
      .filter((notif) => !notif.read)
      .map((notif) => notif.id)

    if (unreadIds.length === 0) {
      return []
    }

    return notificationsHook.markMultipleAsRead(unreadIds)
  }, [notificationsHook])

  /**
   * Toggle panel open/close state
   */
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev)
  }, [])

  /**
   * Close panel
   */
  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  /**
   * Open panel
   */
  const openPanel = useCallback(() => {
    setIsPanelOpen(true)
  }, [])

  const value: NotificationCenterContextValue = {
    // Notification data from hook
    notifications: notificationsHook.notifications,
    unreadCount: notificationsHook.unreadCount,
    isLoading: notificationsHook.isLoading,
    error: notificationsHook.error,

    // Filtered data
    filteredNotifications,
    activeFilter,
    setFilter,

    // Actions
    markAsRead: notificationsHook.markAsRead,
    markMultipleAsRead: notificationsHook.markMultipleAsRead,
    markAllAsRead,
    dismissNotification: notificationsHook.dismissNotification,

    // Preferences
    preferences: preferencesHook.preferences,
    updatePreferences: preferencesHook.updatePreferences,
    preferencesLoading: preferencesHook.isLoading,

    // UI state
    isPanelOpen,
    togglePanel,
    closePanel,
    openPanel,
  }

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  )
}

/**
 * Consumer hook for NotificationCenter context
 *
 * Must be used within NotificationCenterProvider
 */
export function useNotificationCenter(): NotificationCenterContextValue {
  const context = React.useContext(NotificationCenterContext)

  if (!context) {
    throw new Error(
      'useNotificationCenter must be used within NotificationCenterProvider',
    )
  }

  return context
}
