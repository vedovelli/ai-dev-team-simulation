import React from 'react'
import { NotificationCenterContext, type NotificationCenterContextValue } from '../contexts/NotificationCenterContext'

/**
 * Configuration options for useNotificationCenter hook
 *
 * Note: This interface is intentionally minimal as the hook primarily accesses context.
 * Future extensions may include options for persistence, custom event handlers, or analytics.
 * For display-specific options (virtual scrolling, pagination, filtering), use useNotificationCenterDisplay instead.
 */
export interface UseNotificationCenterOptions {
  // Reserved for future use: customization options for context behavior
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
