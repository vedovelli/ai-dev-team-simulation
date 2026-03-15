import React from 'react'
import { NotificationCenterContext, type NotificationCenterContextValue } from '../context/NotificationCenterContext'

/**
 * Configuration options for useNotificationCenter hook
 */
export interface UseNotificationCenterOptions {
  // Could be extended for future use
}

/**
 * Hook to access NotificationCenter context
 * Provides unified API for notifications and preferences
 *
 * Must be used within NotificationCenterProvider
 *
 * Features:
 * - Consolidated notification state (from useNotifications hook)
 * - Consolidated preferences state (from useNotificationPreferences hook)
 * - Computed unread count
 * - Loading and error states for both notifications and preferences
 * - Mutation actions with optimistic updates
 * - Preference filtering and management
 * - UI state management (panel open/close)
 *
 * @throws Error if used outside NotificationCenterProvider
 * @returns NotificationCenterContextValue
 *
 * @example
 * function MyComponent() {
 *   const {
 *     notifications,
 *     unreadCount,
 *     preferences,
 *     markAsRead,
 *     updatePreference,
 *     isLoading,
 *     isError
 *   } = useNotificationCenter()
 *
 *   return (
 *     <div>
 *       <p>Unread: {unreadCount}</p>
 *       {notifications.map(n => (
 *         <button key={n.id} onClick={() => markAsRead(n.id)}>
 *           {n.message}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 */
export function useNotificationCenter(options?: UseNotificationCenterOptions): NotificationCenterContextValue {
  const context = React.useContext(NotificationCenterContext)

  if (!context) {
    throw new Error(
      'useNotificationCenter must be used within NotificationCenterProvider',
    )
  }

  return context
}

export type UseNotificationCenterReturn = NotificationCenterContextValue
