import { http, HttpResponse } from 'msw'
import type { Notification } from '../../types/notification'

/**
 * Generate realistic notification data with various types
 * Includes agent events, sprint updates, and performance alerts
 */
function generateMockNotifications(): Notification[] {
  const agentEvents = [
    'Agent Alice completed task: Implement authentication module',
    'Agent Bob started working on: Database optimization',
    'Agent Charlie submitted code for review: API endpoint refactoring',
    'Agent Diana completed sprint story: User profile page',
  ]

  const sprintUpdates = [
    'Sprint 5 velocity updated: 34 points completed',
    'Sprint backlog refinement scheduled for tomorrow',
    'Sprint 4 completed with 92% on-time delivery',
    'New sprint 6 goals approved by team',
  ]

  const performanceAlerts = [
    'Agent performance: Bob completed 8/10 tasks on time',
    'Team velocity trending upward: +12% this week',
    'Sprint burndown on track: 85% of sprint capacity used',
    'Code review quality: High complexity PR detected',
  ]

  const notifications: Notification[] = []
  const now = new Date()

  // Generate mix of notification types
  const allMessages = [
    ...agentEvents.map((msg, idx) => ({ type: 'agent_event' as const, msg, idx })),
    ...sprintUpdates.map((msg, idx) => ({ type: 'sprint_change' as const, msg, idx })),
    ...performanceAlerts.map((msg, idx) => ({ type: 'performance_alert' as const, msg, idx })),
  ]

  allMessages.forEach((item, idx) => {
    notifications.push({
      id: `notif-${idx + 1}`,
      type: item.type,
      message: item.msg,
      timestamp: new Date(now.getTime() - (idx * 5 * 60 * 1000)).toISOString(), // 5 min intervals
      read: idx > 3, // First 4 are unread
      metadata: {
        source: 'system',
        priority: item.type === 'performance_alert' ? 'high' : 'normal',
      },
    })
  })

  return notifications
}

// In-memory store for notifications
const notificationsStore: Notification[] = generateMockNotifications()

export const notificationHandlers = [
  /**
   * GET /api/notifications
   * Fetch notifications with optional filtering by type and unread status
   * Supports pagination
   */
  http.get('/api/notifications', ({ request }) => {
    const url = new URL(request.url)
    const unread = url.searchParams.get('unread')
    const type = url.searchParams.get('type')
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

    let filtered = [...notificationsStore]

    // Filter by unread status
    if (unread === 'true') {
      filtered = filtered.filter((n) => !n.read)
    }

    // Filter by type
    if (type) {
      filtered = filtered.filter((n) => n.type === type)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Count unread
    const unreadCount = notificationsStore.filter((n) => !n.read).length

    // Pagination
    const start = pageIndex * pageSize
    const end = start + pageSize
    const paginated = filtered.slice(start, end)

    return HttpResponse.json({
      data: paginated,
      total: filtered.length,
      unreadCount,
    })
  }),

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   * Supports optimistic updates
   */
  http.patch('/api/notifications/:id/read', ({ params }) => {
    const { id } = params
    const notifIndex = notificationsStore.findIndex((n) => n.id === id)

    if (notifIndex === -1) {
      return HttpResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updated = {
      ...notificationsStore[notifIndex],
      read: true,
    }

    notificationsStore[notifIndex] = updated
    return HttpResponse.json(updated)
  }),

  /**
   * PATCH /api/notifications/read-batch
   * Mark multiple notifications as read
   */
  http.patch('/api/notifications/read-batch', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] }

    const updated = body.ids.map((id) => {
      const notifIndex = notificationsStore.findIndex((n) => n.id === id)
      if (notifIndex !== -1) {
        const notification = { ...notificationsStore[notifIndex], read: true }
        notificationsStore[notifIndex] = notification
        return notification
      }
      return null
    }).filter((n) => n !== null) as Notification[]

    return HttpResponse.json(updated)
  }),
]
