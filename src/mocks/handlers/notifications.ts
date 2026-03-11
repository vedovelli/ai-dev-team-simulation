import { http, HttpResponse } from 'msw'
import type { Notification, NotificationType } from '../../types/notification'

/**
 * Generate realistic notification data with various types
 *
 * Creates notifications for:
 * - Task assignments/unassignments
 * - Sprint lifecycle events (started/completed)
 * - Comments added to tasks/sprints
 * - Status changes
 * - Agent activity events
 * - Performance alerts
 */
function generateMockNotifications(): Notification[] {
  const agents = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']
  const tasks = [
    'Implement authentication module',
    'Database optimization',
    'API endpoint refactoring',
    'User profile page',
    'Payment integration',
    'Search functionality',
  ]
  const sprints = ['Sprint 4', 'Sprint 5', 'Sprint 6']

  const notifications: Notification[] = []
  const now = new Date()
  let id = 1

  // Task assigned notifications
  tasks.slice(0, 2).forEach((task, idx) => {
    notifications.push({
      id: `notif-${id}`,
      type: 'task_assigned',
      message: `You were assigned to: ${task}`,
      timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
      read: idx > 0,
      metadata: {
        entityId: `task-${id}`,
        entityType: 'task',
        actor: agents[idx % agents.length],
        priority: 'normal',
        source: 'system',
      },
    })
    id++
  })

  // Comment added notifications
  tasks.slice(2, 4).forEach((task, idx) => {
    notifications.push({
      id: `notif-${id}`,
      type: 'comment_added',
      message: `${agents[idx % agents.length]} commented on "${task}"`,
      timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
      read: idx > 0,
      metadata: {
        entityId: `task-${id}`,
        entityType: 'task',
        actor: agents[idx % agents.length],
        priority: 'normal',
        source: 'system',
      },
    })
    id++
  })

  // Sprint lifecycle notifications
  notifications.push({
    id: `notif-${id}`,
    type: 'sprint_started',
    message: `${sprints[0]} has started`,
    timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
    read: false,
    metadata: {
      entityId: 'sprint-4',
      entityType: 'sprint',
      priority: 'high',
      source: 'system',
    },
  })
  id++

  notifications.push({
    id: `notif-${id}`,
    type: 'sprint_completed',
    message: `${sprints[1]} completed with 92% on-time delivery`,
    timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
    read: true,
    metadata: {
      entityId: 'sprint-5',
      entityType: 'sprint',
      priority: 'normal',
      source: 'system',
    },
  })
  id++

  // Status change notifications
  notifications.push({
    id: `notif-${id}`,
    type: 'status_changed',
    message: `Task "${tasks[3]}" status changed to In Progress`,
    timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
    read: true,
    metadata: {
      entityId: 'task-4',
      entityType: 'task',
      priority: 'normal',
      source: 'system',
    },
  })
  id++

  // Agent events
  notifications.push({
    id: `notif-${id}`,
    type: 'agent_event',
    message: `${agents[0]} completed task: ${tasks[4]}`,
    timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
    read: true,
    metadata: {
      entityId: 'agent-1',
      entityType: 'agent',
      actor: agents[0],
      priority: 'normal',
      source: 'system',
    },
  })
  id++

  // Performance alerts
  notifications.push({
    id: `notif-${id}`,
    type: 'performance_alert',
    message: `Team velocity trending upward: +12% this week`,
    timestamp: new Date(now.getTime() - (id * 5 * 60 * 1000)).toISOString(),
    read: true,
    metadata: {
      priority: 'high',
      source: 'analytics',
    },
  })
  id++

  return notifications
}

// In-memory store for notifications
const notificationsStore: Notification[] = generateMockNotifications()

/**
 * WebSocket clients store - simulates connected WebSocket clients
 * In production, this would be handled by the actual WebSocket server
 */
const webSocketClients = new Set<string>()

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

  /**
   * PATCH /api/notifications/:id/dismiss
   * Dismiss (remove) a notification from the list
   * Simulates real-time WebSocket event broadcast
   */
  http.patch('/api/notifications/:id/dismiss', ({ params }) => {
    const { id } = params
    const notifIndex = notificationsStore.findIndex((n) => n.id === id)

    if (notifIndex === -1) {
      return HttpResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Remove from store
    notificationsStore.splice(notifIndex, 1)

    // Simulate broadcasting to WebSocket clients
    // In production, this would send a real WebSocket message
    broadcastToClients({
      type: 'notification:dismissed',
      payload: { id },
    })

    return HttpResponse.json({ success: true })
  }),
]

/**
 * Simulate broadcasting WebSocket messages to connected clients
 * In production, this would use the actual WebSocket server implementation
 */
function broadcastToClients(message: { type: string; payload: any }) {
  // This is a placeholder for the actual WebSocket broadcast logic
  // In a real implementation, this would send messages to all connected WS clients
  console.debug('Broadcasting to WebSocket clients:', message)
}
