import { useCallback, useRef, useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  timeout?: number
}

export interface UseNotificationOptions {
  /** Default auto-dismiss timeout in milliseconds (default: 5000) */
  defaultTimeout?: number
}

/**
 * Custom hook for showing transient notifications/toasts
 * Integrates with TanStack Query mutations for automatic feedback
 *
 * Features:
 * - Stack multiple notifications
 * - Auto-dismiss with configurable timeout
 * - Manual dismiss capability
 * - Keyboard dismissible (Escape key when focused)
 * - Accessible with aria-live regions
 * - Integration hooks for mutations
 *
 * @example
 * ```tsx
 * const { notify, success, error, warning, info } = useNotification()
 *
 * // Show a success notification
 * success('Task created successfully!')
 *
 * // Show a custom notification
 * notify('Custom message', 'info', 3000)
 *
 * // With mutation
 * const mutation = useMutation({
 *   mutationFn: createTask,
 *   onSuccess: () => success('Task created!'),
 *   onError: () => error('Failed to create task')
 * })
 * ```
 */
export function useNotification(options: UseNotificationOptions = {}) {
  const { defaultTimeout = 5000 } = options
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { showToast } = useToast()
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (message: string, type: NotificationType = 'info', timeout = defaultTimeout) => {
      const id = `notif-${Date.now()}-${Math.random()}`
      const notification: Notification = { id, message, type, timeout }

      setNotifications((prev) => [...prev, notification])
      showToast(message, type)

      // Schedule auto-dismiss
      if (timeout > 0) {
        const timeoutId = setTimeout(() => {
          dismiss(id)
        }, timeout)
        timeoutRefs.current.set(id, timeoutId)
      }

      return id
    },
    [defaultTimeout, dismiss, showToast]
  )

  const success = useCallback(
    (message: string, timeout?: number) => notify(message, 'success', timeout),
    [notify]
  )

  const error = useCallback(
    (message: string, timeout?: number) => notify(message, 'error', timeout),
    [notify]
  )

  const warning = useCallback(
    (message: string, timeout?: number) => notify(message, 'warning', timeout),
    [notify]
  )

  const info = useCallback(
    (message: string, timeout?: number) => notify(message, 'info', timeout),
    [notify]
  )

  return {
    // Core functions
    notify,
    success,
    error,
    warning,
    info,
    dismiss,

    // State
    notifications,
    count: notifications.length,
  }
}
