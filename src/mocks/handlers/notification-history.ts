import { http, HttpResponse } from 'msw'
import type {
  Notification,
  NotificationEventType,
  NotificationType,
} from '../../types/notification'
import type {
  NotificationHistoryEntry,
  NotificationHistoryResponse,
  NotificationHistoryFilters,
} from '../../hooks/useNotificationHistory'

/**
 * Generate cursor token from a notification entry
 * Format: base64-encoded "timestamp:id" for realistic cursor behavior
 */
function generateCursor(notif: NotificationHistoryEntry): string {
  const token = `${notif.timestamp}:${notif.id}`
  return Buffer.from(token).toString('base64')
}

/**
 * Decode a cursor to extract timestamp:id for comparison
 */
function decodeCursor(cursor: string): { timestamp: string; id: string } | null {
  try {
    const token = Buffer.from(cursor, 'base64').toString('utf-8')
    const [timestamp, id] = token.split(':')
    return { timestamp, id }
  } catch {
    return null
  }
}

/**
 * Generate historical notification data with realistic variety
 * Includes varied timestamps, types, and read status
 * Used for testing history view, filtering, and pagination
 */
function generateHistoryNotifications(): NotificationHistoryEntry[] {
  const agents = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry',
  ]
  const tasks = [
    'Implement authentication module',
    'Database optimization',
    'API endpoint refactoring',
    'User profile page',
    'Payment integration',
    'Search functionality',
    'Email notifications',
    'File upload system',
  ]
  const sprints = ['Sprint 4', 'Sprint 5', 'Sprint 6', 'Sprint 7']
  const eventTypes: NotificationEventType[] = [
    'assignment_changed',
    'sprint_updated',
    'task_reassigned',
    'deadline_approaching',
  ]
  const legacyTypes: NotificationType[] = [
    'agent_event',
    'sprint_completed',
    'comment_added',
    'status_changed',
  ]

  const notifications: NotificationHistoryEntry[] = []
  const now = new Date()
  let notifIndex = 1

  // Generate ~150 historical notifications with varied timestamps
  // Spread across multiple days to simulate realistic history

  // Recent notifications (last 7 days)
  for (let i = 0; i < 50; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const task = tasks[Math.floor(Math.random() * tasks.length)]
    const sprint = sprints[Math.floor(Math.random() * sprints.length)]

    // Vary timestamp: 0-7 days ago
    const daysAgo = Math.floor(Math.random() * 7)
    const hoursAgo = daysAgo * 24 + Math.floor(Math.random() * 24)
    const minutesAgo = hoursAgo * 60 + Math.floor(Math.random() * 60)

    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString()

    // ~70% chance of being read
    const isRead = Math.random() > 0.3
    const readAt = isRead
      ? new Date(
          new Date(timestamp).getTime() + Math.random() * 60 * 60 * 1000
        ).toISOString()
      : undefined

    let message = ''
    let relatedId = ''

    switch (eventType) {
      case 'assignment_changed':
        message = `Task "${task}" assigned to ${agent}`
        relatedId = `agent-${i % 10}`
        break
      case 'sprint_updated':
        message = `${sprint} checkpoint: ${Math.floor(Math.random() * 50) + 10} points completed`
        relatedId = `sprint-${i % 5}`
        break
      case 'task_reassigned':
        message = `Task "${task}" reassigned to ${agent}`
        relatedId = `task-${i}`
        break
      case 'deadline_approaching':
        message = `Deadline approaching: "${task}" due ${Math.random() > 0.5 ? 'in 1 hour' : 'tomorrow'}`
        relatedId = `task-${i}`
        break
    }

    notifications.push({
      id: `notif-hist-${notifIndex}`,
      type: eventType,
      eventType,
      message,
      timestamp,
      read: isRead,
      readAt,
      createdAt: timestamp,
      priority: eventType === 'deadline_approaching' ? 'high' : 'normal',
      relatedId,
      metadata: {
        eventType,
        source: 'system',
        priority: eventType === 'deadline_approaching' ? 'high' : 'normal',
      },
    })
    notifIndex++
  }

  // Older notifications (7-30 days ago)
  for (let i = 0; i < 50; i++) {
    const type = legacyTypes[Math.floor(Math.random() * legacyTypes.length)]
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const task = tasks[Math.floor(Math.random() * tasks.length)]

    // Vary timestamp: 7-30 days ago
    const daysAgo = 7 + Math.floor(Math.random() * 23)
    const hoursAgo = daysAgo * 24 + Math.floor(Math.random() * 24)
    const minutesAgo = hoursAgo * 60 + Math.floor(Math.random() * 60)

    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString()

    // Older notifications are mostly read
    const isRead = Math.random() > 0.1
    const readAt = isRead
      ? new Date(
          new Date(timestamp).getTime() + Math.random() * 60 * 60 * 1000
        ).toISOString()
      : undefined

    let message = ''
    let relatedId = ''

    switch (type) {
      case 'agent_event':
        message = `${agent} completed task: ${task}`
        relatedId = `agent-${i % 10}`
        break
      case 'sprint_completed':
        message = `${sprints[i % 4]} completed with ${Math.floor(Math.random() * 40) + 50}% on-time delivery`
        relatedId = `sprint-${i % 5}`
        break
      case 'comment_added':
        message = `${agent} commented on "${task}"`
        relatedId = `task-${i}`
        break
      case 'status_changed':
        message = `Task "${task}" status changed to In Progress`
        relatedId = `task-${i}`
        break
    }

    notifications.push({
      id: `notif-hist-${notifIndex}`,
      type,
      message,
      timestamp,
      read: isRead,
      readAt,
      createdAt: timestamp,
      priority: 'normal',
      relatedId,
      metadata: {
        source: 'system',
        priority: 'normal',
      },
    })
    notifIndex++
  }

  // Very old notifications (30-90 days ago, mostly read)
  for (let i = 0; i < 50; i++) {
    const type = legacyTypes[Math.floor(Math.random() * legacyTypes.length)]
    const agent = agents[Math.floor(Math.random() * agents.length)]
    const task = tasks[Math.floor(Math.random() * tasks.length)]

    // Vary timestamp: 30-90 days ago
    const daysAgo = 30 + Math.floor(Math.random() * 60)
    const hoursAgo = daysAgo * 24 + Math.floor(Math.random() * 24)
    const minutesAgo = hoursAgo * 60 + Math.floor(Math.random() * 60)

    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString()

    // Very old notifications are always read
    const isRead = true
    const readAt = new Date(
      new Date(timestamp).getTime() + Math.random() * 60 * 60 * 1000
    ).toISOString()

    let message = ''
    let relatedId = ''

    switch (type) {
      case 'agent_event':
        message = `${agent} completed task: ${task}`
        relatedId = `agent-${i % 10}`
        break
      case 'sprint_completed':
        message = `${sprints[i % 4]} completed with ${Math.floor(Math.random() * 40) + 50}% on-time delivery`
        relatedId = `sprint-${i % 5}`
        break
      case 'comment_added':
        message = `${agent} commented on "${task}"`
        relatedId = `task-${i}`
        break
      case 'status_changed':
        message = `Task "${task}" status changed to Done`
        relatedId = `task-${i}`
        break
    }

    notifications.push({
      id: `notif-hist-${notifIndex}`,
      type,
      message,
      timestamp,
      read: isRead,
      readAt,
      createdAt: timestamp,
      priority: 'normal',
      relatedId,
      metadata: {
        source: 'system',
        priority: 'normal',
      },
    })
    notifIndex++
  }

  // Sort by timestamp descending (newest first)
  notifications.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return notifications
}

// In-memory store for notification history
let historyStore: NotificationHistoryEntry[] = generateHistoryNotifications()

export const notificationHistoryHandlers = [
  /**
   * GET /api/notifications/history
   * Fetch notification history with cursor-based pagination and filtering
   *
   * Query parameters:
   * - cursor: Cursor token for pagination (optional, for pages after first)
   * - limit: Number of items per page (default: 20, max: 100)
   * - type: Filter by notification type (optional)
   * - status: Filter by read status: 'read' | 'unread' | 'all' (default: 'all')
   * - startDate: Filter by start date ISO 8601 (optional)
   * - endDate: Filter by end date ISO 8601 (optional)
   *
   * Response: NotificationHistoryResponse
   * - items: Paginated array of notifications
   * - pagination: Metadata with cursor tokens and hasMore flag
   * - totalCount: Total count of filtered notifications
   * - unreadCount: Count of unread notifications in filtered results
   */
  http.get('/api/notifications/history', ({ request }) => {
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '20', 10),
      100
    )
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status') as
      | 'read'
      | 'unread'
      | 'all'
      | null
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Apply filters to history
    let filtered = [...historyStore]

    // Filter by type
    if (type) {
      filtered = filtered.filter((n) => n.type === type || n.eventType === type)
    }

    // Filter by read status
    if (status === 'read') {
      filtered = filtered.filter((n) => n.read)
    } else if (status === 'unread') {
      filtered = filtered.filter((n) => !n.read)
    }

    // Filter by date range
    if (startDate) {
      const startTime = new Date(startDate).getTime()
      filtered = filtered.filter((n) => new Date(n.timestamp).getTime() >= startTime)
    }
    if (endDate) {
      const endTime = new Date(endDate).getTime()
      filtered = filtered.filter((n) => new Date(n.timestamp).getTime() <= endTime)
    }

    // Count unread in filtered results
    const unreadCount = filtered.filter((n) => !n.read).length
    const totalCount = filtered.length

    // Find start position based on cursor
    let startIndex = 0
    if (cursor) {
      const decoded = decodeCursor(cursor)
      if (decoded) {
        const cursorIndex = filtered.findIndex(
          (n) => n.timestamp === decoded.timestamp && n.id === decoded.id
        )
        startIndex = cursorIndex !== -1 ? cursorIndex + 1 : 0
      }
    }

    // Get page of notifications
    const items = filtered.slice(startIndex, startIndex + limit)

    // Determine if there are more notifications
    const hasMore = startIndex + limit < filtered.length

    // Generate next cursor from last item if there are more
    const nextCursor =
      hasMore && items.length > 0
        ? generateCursor(items[items.length - 1])
        : null

    return HttpResponse.json({
      items,
      pagination: {
        cursor: cursor || null,
        nextCursor,
        hasMore,
        pageSize: limit,
      },
      totalCount,
      unreadCount,
    } as NotificationHistoryResponse)
  }),
]
