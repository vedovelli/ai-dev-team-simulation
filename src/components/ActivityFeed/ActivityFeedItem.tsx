import type { ActivityEvent } from '../../types/activity'

interface ActivityFeedItemProps {
  event: ActivityEvent
}

/**
 * Format relative time from ISO string
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

/**
 * Get icon for activity event type
 */
function getEventIcon(type: ActivityEvent['type']): string {
  switch (type) {
    case 'task_assigned':
      return '📋'
    case 'task_status_changed':
      return '✅'
    case 'comment_added':
      return '💬'
    case 'sprint_updated':
      return '🎯'
    case 'sprint_archived':
      return '📦'
    case 'task_completed':
      return '🏁'
    case 'task_created':
      return '✨'
    case 'agent_status_change':
      return '👤'
    default:
      return '📝'
  }
}

/**
 * Get display label for activity event type
 */
function getEventLabel(type: ActivityEvent['type']): string {
  switch (type) {
    case 'task_assigned':
      return 'Task Assigned'
    case 'task_status_changed':
      return 'Status Changed'
    case 'comment_added':
      return 'Comment Added'
    case 'sprint_updated':
      return 'Sprint Updated'
    case 'sprint_archived':
      return 'Sprint Archived'
    case 'task_completed':
      return 'Task Completed'
    case 'task_created':
      return 'Task Created'
    case 'agent_status_change':
      return 'Status Changed'
    default:
      return type
  }
}

/**
 * Get Tailwind color classes for event type
 */
function getEventColorClasses(type: ActivityEvent['type']): {
  border: string
  bg: string
  badge: string
} {
  switch (type) {
    case 'task_assigned':
    case 'task_created':
      return {
        border: 'border-l-blue-500',
        bg: 'bg-blue-500/5',
        badge: 'bg-blue-500/20 text-blue-300',
      }
    case 'task_status_changed':
    case 'task_completed':
      return {
        border: 'border-l-emerald-500',
        bg: 'bg-emerald-500/5',
        badge: 'bg-emerald-500/20 text-emerald-300',
      }
    case 'comment_added':
      return {
        border: 'border-l-purple-500',
        bg: 'bg-purple-500/5',
        badge: 'bg-purple-500/20 text-purple-300',
      }
    case 'sprint_updated':
    case 'sprint_archived':
      return {
        border: 'border-l-amber-500',
        bg: 'bg-amber-500/5',
        badge: 'bg-amber-500/20 text-amber-300',
      }
    default:
      return {
        border: 'border-l-slate-500',
        bg: 'bg-slate-500/5',
        badge: 'bg-slate-500/20 text-slate-300',
      }
  }
}

/**
 * Generate description from activity event payload
 */
function getEventDescription(event: ActivityEvent): string {
  const { type, payload, actorName } = event

  switch (type) {
    case 'task_assigned':
      return `${actorName} assigned task ${payload.taskId}`
    case 'task_status_changed':
      return `${actorName} changed status from ${payload.from} to ${payload.to}`
    case 'comment_added':
      return `${actorName} added a comment on ${payload.taskId}`
    case 'sprint_updated':
      return `${actorName} updated sprint ${payload.sprintId}`
    case 'sprint_archived':
      return `${actorName} archived sprint ${payload.sprintId}`
    case 'task_completed':
      return `${actorName} completed ${payload.taskId}`
    case 'task_created':
      return `${actorName} created a new task`
    default:
      return `${actorName} performed an action`
  }
}

/**
 * ActivityFeedItem component
 *
 * Renders a single activity event with icon, label, description, and timestamp.
 * Supports accessibility with semantic HTML and ARIA attributes.
 */
export function ActivityFeedItem({ event }: ActivityFeedItemProps) {
  const colors = getEventColorClasses(event.type)
  const icon = getEventIcon(event.type)
  const label = getEventLabel(event.type)
  const description = getEventDescription(event)
  const relativeTime = formatRelativeTime(event.createdAt)

  return (
    <article
      className={`${colors.border} ${colors.bg} border-l-4 rounded-lg p-4 transition-all hover:shadow-lg`}
      role="article"
      aria-label={`${label} by ${event.actorName}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${colors.badge}`}
            >
              {label}
            </span>
            <time className="text-slate-400 text-sm">{relativeTime}</time>
          </div>
          <p className="text-slate-200 mt-2">{description}</p>
        </div>
      </div>
    </article>
  )
}
