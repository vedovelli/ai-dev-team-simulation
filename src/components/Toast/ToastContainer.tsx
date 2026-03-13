import { useState, useCallback } from 'react'
import { Toast } from './Toast'
import type { Notification } from '@/types/notification'

interface ToastContainerProps {
  notifications: Notification[]
  maxToasts?: number
}

export function ToastContainer({ notifications, maxToasts = 3 }: ToastContainerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
  }, [])

  // Only show recent non-dismissed toasts, capped at maxToasts
  const visibleToasts = notifications
    .filter((n) => !dismissedIds.has(n.id))
    .slice(0, maxToasts)

  if (visibleToasts.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {visibleToasts.map((notification) => (
        <div key={notification.id} className="pointer-events-auto animate-out fade-out slide-out-to-right-4 duration-300">
          <Toast
            notification={notification}
            onDismiss={handleDismiss}
          />
        </div>
      ))}
    </div>
  )
}
