import React, { createContext, useContext } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../hooks/useNotifications'
import type { NotificationType } from '../components/NotificationToast/NotificationToast'

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (
    message: string,
    options?: {
      type?: NotificationType
      category?: 'agent' | 'sprint' | 'alert'
      autoDismiss?: boolean
    },
  ) => string
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const notificationState = useNotifications()

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider',
    )
  }
  return context
}
