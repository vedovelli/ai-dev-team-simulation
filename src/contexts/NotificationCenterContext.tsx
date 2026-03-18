import React, { createContext, ReactNode, useState, useCallback, useMemo, useContext } from 'react'
import type { Notification, NotificationFilter } from '../types/notification'
import type { NotificationPreferences } from '../types/notification-preferences'
import { useNotifications } from '../hooks/useNotifications'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences'

/**
 * Context value shape for NotificationCenter
 * Consolidates useNotifications and useNotificationPreferences into a single unified interface
 */
export interface NotificationCenterContextValue {
  // Notification data
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  error: Error | null

  // Preferences
  preferences: NotificationPreferences | undefined
  preferencesLoading: boolean
  preferencesError: Error | null

  // Filtered views
  filteredNotifications: Notification[]
  activeFilter: NotificationFilter
  setFilter: (filter: NotificationFilter) => void

  // Actions
  markAsRead: (id: string) => void
  markAllAsRead: () => Promise<Notification[]>
  markMultipleAsRead: (ids: string[]) => Promise<Notification[]>
  updatePreference: (type: string, patch: Record<string, unknown>) => void
  dismissNotification: (id: string) => void

  // UI state
  isPanelOpen: boolean
  togglePanel: () => void
  closePanel: () => void
  openPanel: () => void
}

/**
 * NotificationCenter context for unified notification and preference management
 */
export const NotificationCenterContext = createContext<NotificationCenterContextValue | undefined>(undefined)

export interface NotificationCenterProviderProps {
  children: ReactNode
}

/**
 * Provider that wraps notification hooks and exposes a clean interface
 *
 * REQUIRED: This provider must wrap all components using useNotificationCenter hook.
 * Using useNotificationCenter outside this provider will throw an error.
 *
 * Features:
 * - Centralizes notification state management
 * - Consolidates useNotifications and useNotificationPreferences into single API
 * - Provides filtering (all, unread, by type)
 * - Panel open/close state management
 * - Preferences management with updatePreference action
 * - No duplicate network calls (shared TanStack Query cache keys)
 *
 * @example
 * // In your root layout or app component:
 * <NotificationCenterProvider>
 *   <App />
 * </NotificationCenterProvider>
 *
 * // Then in any child component:
 * function NotificationBell() {
 *   const { unreadCount, markAsRead } = useNotificationCenter()
 *   // ...
 * }
 */
export function NotificationCenterProvider({ children }: NotificationCenterProviderProps) {
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
   * Update a specific notification preference type
   */
  const updatePreference = useCallback((type: string, patch: Record<string, unknown>) => {
    preferencesHook.updatePreferences({
      [type]: patch,
    })
  }, [preferencesHook])

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

  // Compute loading and error states
  const isLoading = notificationsHook.isLoading
  const isError = notificationsHook.error !== null || preferencesHook.error !== null
  const error = notificationsHook.error ?? preferencesHook.error ?? null

  const value: NotificationCenterContextValue = {
    // Notification data from hook
    notifications: notificationsHook.notifications,
    unreadCount: notificationsHook.unreadCount,
    isLoading,
    isError,
    error,

    // Filtered data
    filteredNotifications,
    activeFilter,
    setFilter,

    // Actions
    markAsRead: notificationsHook.markAsRead,
    markMultipleAsRead: notificationsHook.markMultipleAsRead,
    markAllAsRead,
    updatePreference,
    dismissNotification: notificationsHook.dismissNotification,

    // Preferences
    preferences: preferencesHook.preferences,
    preferencesLoading: preferencesHook.isLoading,
    preferencesError: preferencesHook.error,

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
 * Hook to access NotificationCenter context
 *
 * Must be used within NotificationCenterProvider
 */
export function useNotificationCenterContext(): NotificationCenterContextValue {
  const context = useContext(NotificationCenterContext)

  if (!context) {
    throw new Error(
      'useNotificationCenterContext must be used within NotificationCenterProvider'
    )
  }

  return context
}

/**
 * @deprecated Use useNotificationCenterContext instead
 */
export const useNotificationCenter = useNotificationCenterContext
