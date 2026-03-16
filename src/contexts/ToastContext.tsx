import React, { createContext, ReactNode, useCallback, useState, useMemo } from 'react'
import type { Notification } from '../types/notification'

/**
 * Represents a single toast in the queue
 */
export interface Toast {
  id: string
  notification: Notification
  createdAt: number
}

/**
 * Context value shape for toast management
 */
export interface ToastContextValue {
  toasts: Toast[]
  addToast: (notification: Notification) => string
  dismissToast: (id: string) => void
  clearAllToasts: () => void
}

/**
 * Toast context for managing notification toasts globally
 */
export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export interface ToastProviderProps {
  children: ReactNode
  /** Maximum number of visible toasts (default: 3) */
  maxVisible?: number
}

/**
 * Provider that manages toast notifications
 *
 * Features:
 * - Centralizes toast state management
 * - Limits concurrent visible toasts (default 3)
 * - Provides actions: addToast, dismissToast, clearAllToasts
 * - FIFO queue: newest toasts at the end, oldest removed first when limit exceeded
 *
 * @example
 * // In your root layout:
 * <ToastProvider maxVisible={3}>
 *   <App />
 * </ToastProvider>
 *
 * // Then in any child component:
 * function MyComponent() {
 *   const { addToast } = useToastContext()
 *   // ...
 * }
 */
export function ToastProvider({ children, maxVisible = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  /**
   * Add a notification as a toast
   * Returns the toast ID
   */
  const addToast = useCallback(
    (notification: Notification): string => {
      const toastId = `toast-${notification.id}-${Date.now()}`

      setToasts((prev) => {
        const updated = [
          ...prev,
          {
            id: toastId,
            notification,
            createdAt: Date.now(),
          },
        ]

        // Keep only the most recent maxVisible toasts
        if (updated.length > maxVisible) {
          return updated.slice(updated.length - maxVisible)
        }

        return updated
      })

      return toastId
    },
    [maxVisible]
  )

  /**
   * Dismiss a toast by ID
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const value: ToastContextValue = useMemo(
    () => ({
      toasts,
      addToast,
      dismissToast,
      clearAllToasts,
    }),
    [toasts, addToast, dismissToast, clearAllToasts]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

/**
 * Hook to access toast context
 * Must be used within ToastProvider
 */
export function useToastContext(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

export type UseToastContextReturn = ReturnType<typeof useToastContext>
