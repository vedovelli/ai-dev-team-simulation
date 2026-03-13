import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Notification } from '@/types/notification'

interface ToastProps {
  notification: Notification
  onDismiss: (id: string) => void
  duration?: number
}

const typeColors = {
  assignment_changed: 'bg-blue-50 border-blue-200 text-blue-900',
  sprint_updated: 'bg-purple-50 border-purple-200 text-purple-900',
  task_reassigned: 'bg-amber-50 border-amber-200 text-amber-900',
  deadline_approaching: 'bg-red-50 border-red-200 text-red-900',
  // Fallback for other types
  task_assigned: 'bg-blue-50 border-blue-200 text-blue-900',
  task_unassigned: 'bg-gray-50 border-gray-200 text-gray-900',
  sprint_started: 'bg-green-50 border-green-200 text-green-900',
  sprint_completed: 'bg-green-50 border-green-200 text-green-900',
  comment_added: 'bg-blue-50 border-blue-200 text-blue-900',
  status_changed: 'bg-blue-50 border-blue-200 text-blue-900',
  agent_event: 'bg-gray-50 border-gray-200 text-gray-900',
  performance_alert: 'bg-yellow-50 border-yellow-200 text-yellow-900',
}

const typeIcons = {
  assignment_changed: '👤',
  sprint_updated: '🏃',
  task_reassigned: '↩️',
  deadline_approaching: '⏰',
  task_assigned: '👤',
  task_unassigned: '✖️',
  sprint_started: '🚀',
  sprint_completed: '✅',
  comment_added: '💬',
  status_changed: '🔄',
  agent_event: '🤖',
  performance_alert: '⚠️',
}

export function Toast({ notification, onDismiss, duration = 5000 }: ToastProps) {
  const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.task_assigned
  const icon = typeIcons[notification.type as keyof typeof typeIcons] || '📢'

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [notification.id, onDismiss, duration])

  return (
    <div
      className={`
        ${colorClass}
        animate-in fade-in slide-in-from-right-4
        border rounded-lg p-4 shadow-lg
        flex items-start gap-3
        max-w-md
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{notification.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X size={18} />
      </button>
    </div>
  )
}
