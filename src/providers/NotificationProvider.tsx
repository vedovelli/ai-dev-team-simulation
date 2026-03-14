import React, { useCallback, useContext, useMemo } from 'react'
import type { NotificationEventType, Notification } from '../types/notification'

/**
 * Broadcast event structure for notification events
 */
export interface NotificationBroadcastEvent {
  type: NotificationEventType
  data: Notification | Partial<Notification>
  timestamp: number
}

/**
 * Notification context type
 */
interface NotificationContextType {
  /** Subscribe to notification events */
  subscribe: (callback: (event: NotificationBroadcastEvent) => void) => () => void
  /** Broadcast a notification event */
  broadcast: (event: NotificationBroadcastEvent) => void
}

/**
 * Create notification context with proper typing
 */
const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

/**
 * Props for NotificationProvider
 */
interface NotificationProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that manages notification broadcast events
 *
 * This provider enables a subscription-based pattern where UI components
 * can listen to specific notification event types without polling.
 *
 * Usage:
 * ```tsx
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 * ```
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  // Store all active subscribers
  const subscribersRef = React.useRef<Set<(event: NotificationBroadcastEvent) => void>>(new Set())

  /**
   * Subscribe to all notification broadcast events
   * Returns an unsubscribe function
   */
  const subscribe = useCallback((callback: (event: NotificationBroadcastEvent) => void) => {
    subscribersRef.current.add(callback)

    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  /**
   * Broadcast an event to all subscribers
   */
  const broadcast = useCallback((event: NotificationBroadcastEvent) => {
    subscribersRef.current.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in notification subscriber:', error)
      }
    })
  }, [])

  const value = useMemo<NotificationContextType>(() => ({ subscribe, broadcast }), [subscribe, broadcast])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

/**
 * Hook to access the notification context
 * @throws Error if used outside NotificationProvider
 */
export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider')
  }
  return context
}
