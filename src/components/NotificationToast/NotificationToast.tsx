import { useEffect, useState } from 'react'
import type { Notification } from '../../types/notification'

export interface NotificationToastProps {
  notification: Notification
  onDismiss: () => void
  /** Duration in milliseconds before auto-dismiss (default: 6000 = 6s) */
  autoDismissMs?: number
}

/**
 * Individual notification toast component
 *
 * Features:
 * - Color-coded by notification type
 * - Type-specific icon and label
 * - Manual dismiss button
 * - Progress bar showing auto-dismiss countdown
 * - Optional animation/pulse for high-priority types (deadline_approaching, task_reassigned)
 * - Smooth fade-out transition on dismiss
 */
export function NotificationToast({
  notification,
  onDismiss,
  autoDismissMs = 6000,
}: NotificationToastProps) {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)

  // Track auto-dismiss countdown
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100)
      setProgress(remaining)

      // Auto-dismiss when countdown reaches 0
      if (remaining === 0) {
        clearInterval(interval)
        handleClose()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [autoDismissMs])

  const handleClose = () => {
    setIsExiting(true)
    // Wait for fade-out animation before calling onDismiss
    setTimeout(() => {
      onDismiss()
    }, 150)
  }

  // Determine if this is a high-priority notification
  const isHighPriority =
    notification.type === 'deadline_approaching' || notification.type === 'task_reassigned'

  // Get toast configuration based on notification type
  const getToastConfig = () => {
    switch (notification.type) {
      case 'assignment_changed':
        return {
          icon: '👤',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          barColor: 'bg-blue-400',
          label: 'Assignment',
        }
      case 'sprint_updated':
        return {
          icon: '⚡',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-900',
          barColor: 'bg-purple-400',
          label: 'Sprint Update',
        }
      case 'task_reassigned':
        return {
          icon: '📋',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-900',
          barColor: 'bg-amber-400',
          label: 'Task Reassigned',
        }
      case 'deadline_approaching':
        return {
          icon: '⏰',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          barColor: 'bg-red-400',
          label: 'Deadline Alert',
        }
      default:
        return {
          icon: '🔔',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-900',
          barColor: 'bg-gray-400',
          label: 'Notification',
        }
    }
  }

  const config = getToastConfig()

  return (
    <div
      className={`
        transform transition-all duration-150 ease-out
        ${isExiting ? 'translate-x-96 opacity-0' : 'translate-x-0 opacity-100'}
        ${isHighPriority ? 'animate-pulse' : ''}
      `}
    >
      <div
        className={`
          ${config.bgColor} ${config.borderColor}
          border rounded-lg shadow-lg p-4 w-80 max-w-sm
          flex flex-col gap-2
          ${isHighPriority ? 'ring-2 ring-offset-2 ring-current' : ''}
        `}
      >
        {/* Header with icon and message */}
        <div className="flex items-start gap-3">
          <span className={`text-xl flex-shrink-0 ${isHighPriority ? 'animate-bounce' : ''}`}>
            {config.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${config.textColor}`}>
              {config.label}
            </p>
            <p className={`text-sm ${config.textColor} line-clamp-2`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 text-lg leading-none
              ${config.textColor} hover:opacity-70 transition-opacity
              w-5 h-5 flex items-center justify-center
            `}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
