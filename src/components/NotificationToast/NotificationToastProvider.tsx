import { useEffect, useRef } from 'react'
import { useNotificationEvents } from '../../hooks/useNotificationEvents'
import { useToastContext } from '../../contexts/ToastContext'

/**
 * Provider component that connects useNotificationEvents to the toast queue
 *
 * This component:
 * - Listens for new notification events via useNotificationEvents
 * - Adds them to the toast context when they arrive
 * - Manages auto-dismiss timeouts (6 seconds)
 * - Cleans up timeouts on unmount
 *
 * Should be mounted somewhere in the component tree where ToastProvider is active.
 *
 * @example
 * <ToastProvider>
 *   <NotificationToastProvider />
 *   <App />
 *   <ToastContainer />
 * </ToastProvider>
 */
export function NotificationToastProvider() {
  const { events } = useNotificationEvents()
  const { addToast, dismissToast } = useToastContext()

  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const addedToastsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Process each new event
    for (const event of events) {
      // Skip if we've already added this to the toast queue
      if (addedToastsRef.current.has(event.notification.id)) {
        continue
      }

      // Add toast to context
      const toastId = addToast(event.notification)
      addedToastsRef.current.add(event.notification.id)

      // Set up auto-dismiss after 6 seconds
      const timeout = setTimeout(() => {
        dismissToast(toastId)
        addedToastsRef.current.delete(event.notification.id)
      }, 6000)

      timeoutsRef.current.set(toastId, timeout)
    }
  }, [events, addToast, dismissToast])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout)
      }
      timeoutsRef.current.clear()
    }
  }, [])

  // This component doesn't render anything
  return null
}
