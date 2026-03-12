import { http, HttpResponse } from 'msw'
import type { Notification, NotificationEventType } from '../../types/notification'

/**
 * Generate realistic notification data with event types
 * Includes: assignment_changed, sprint_updated, task_reassigned, deadline_approaching
 * Also supports legacy types: agent_event, sprint_change, performance_alert
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

  // Structured event message templates
  const assignmentChangedMessages = [
    { msg: 'Task "Implement authentication module" assigned to Agent Alice', eventType: 'assignment_changed' as const, agentId: 'agent-1' },
    { msg: 'Task "Fix database connection pool" reassigned from Bob to Charlie', eventType: 'assignment_changed' as const, agentId: 'agent-3' },
  ]

  const sprintUpdatedMessages = [
    { msg: 'Sprint 5 status changed: Story points velocity updated to 34', eventType: 'sprint_updated' as const, sprintId: 'sprint-5' },
    { msg: 'Sprint 6 backlog refinement scheduled for tomorrow at 2 PM', eventType: 'sprint_updated' as const, sprintId: 'sprint-6' },
  ]

  const taskReassignedMessages = [
    { msg: 'Task reassigned: "API endpoint refactoring" moved from Alice to Diana', eventType: 'task_reassigned' as const, taskId: 'task-123' },
    { msg: 'Task reassigned: "User profile page" reassigned to Agent Bob', eventType: 'task_reassigned' as const, taskId: 'task-456' },
  ]

  const deadlineApproachingMessages = [
    { msg: 'Deadline approaching: "Complete core features" due in 2 days', eventType: 'deadline_approaching' as const, taskId: 'task-789', priority: 'high' as const },
    { msg: 'Deadline approaching: "Documentation review" due in 1 day', eventType: 'deadline_approaching' as const, taskId: 'task-101', priority: 'high' as const },
  ]

  // Legacy notification types for backward compatibility
  const legacyAgentEvents = [
    { msg: 'Agent Alice completed task: Implement authentication module', type: 'agent_event' as const },
    { msg: 'Agent Bob started working on: Database optimization', type: 'agent_event' as const },
  ]

  const legacySprintUpdates = [
    { msg: 'Sprint 4 completed with 92% on-time delivery', type: 'sprint_change' as const },
    { msg: 'New sprint 6 goals approved by team', type: 'sprint_change' as const },
  ]

  const notifications: Notification[] = []
  const now = new Date()
  let notifIndex = 1

  /**
   * Helper to create a notification with proper timestamp alignment.
   * Captures the current id before incrementing to ensure consistency
   * between the notification ID and its timestamp calculation.
   * This prevents timestamp calculation bugs where id is incremented
   * in the template literal before being used in the timestamp.
   *
   * Timestamps are offset such that earlier-created notifications
   * have more recent timestamps (lower index = closer to now), simulating
   * notifications arriving in reverse chronological order. Each notification
   * is offset by 5 minutes from the previous one.
   */
  const addNotification = (notif: Omit<Notification, 'timestamp'>) => {
    const minutesOffset = notifIndex * 5
    notifications.push({
      ...notif,
      timestamp: new Date(now.getTime() - (minutesOffset * 60 * 1000)).toISOString(),
    })
    notifIndex++
  }

  // Add structured event notifications
  const allStructuredMessages = [
    ...assignmentChangedMessages,
    ...sprintUpdatedMessages,
    ...taskReassignedMessages,
    ...deadlineApproachingMessages,
  ]

  allStructuredMessages.forEach((item, idx) => {
    addNotification({
      id: `notif-${notifIndex}`,
      type: item.eventType,
      eventType: item.eventType,
      message: item.msg,
      read: idx > 1, // First 2 are unread
      priority: item.priority || 'normal',
      relatedId: (item as any).agentId || (item as any).sprintId || (item as any).taskId,
      metadata: {
        eventType: item.eventType,
        source: 'system',
        priority: item.priority || 'normal',
      },
    })
  })

  // Add legacy notifications for backward compatibility
  const allLegacyMessages = [
    ...legacyAgentEvents,
    ...legacySprintUpdates,
  ]

  allLegacyMessages.forEach((item, idx) => {
    addNotification({
      id: `notif-${notifIndex}`,
      type: item.type,
      message: item.msg,
      read: idx > 1,
      metadata: {
        source: 'system',
        priority: 'normal',
      },
    })
  })

  // Comment added notifications
  tasks.slice(2, 4).forEach((task, idx) => {
    addNotification({
      id: `notif-${id}`,
      type: 'comment_added',
      message: `${agents[idx % agents.length]} commented on "${task}"`,
      read: idx > 0,
      metadata: {
        entityId: `task-${id}`,
        entityType: 'task',
        actor: agents[idx % agents.length],
        priority: 'normal',
        source: 'system',
      },
    })
  })

  // Sprint lifecycle notifications
  addNotification({
    id: `notif-${id}`,
    type: 'sprint_started',
    message: `${sprints[0]} has started`,
    read: false,
    metadata: {
      entityId: 'sprint-4',
      entityType: 'sprint',
      priority: 'high',
      source: 'system',
    },
  })

  addNotification({
    id: `notif-${id}`,
    type: 'sprint_completed',
    message: `${sprints[1]} completed with 92% on-time delivery`,
    read: true,
    metadata: {
      entityId: 'sprint-5',
      entityType: 'sprint',
      priority: 'normal',
      source: 'system',
    },
  })

  // Status change notifications
  addNotification({
    id: `notif-${id}`,
    type: 'status_changed',
    message: `Task "${tasks[3]}" status changed to In Progress`,
    read: true,
    metadata: {
      entityId: 'task-4',
      entityType: 'task',
      priority: 'normal',
      source: 'system',
    },
  })

  // Agent events
  addNotification({
    id: `notif-${id}`,
    type: 'agent_event',
    message: `${agents[0]} completed task: ${tasks[4]}`,
    read: true,
    metadata: {
      entityId: 'agent-1',
      entityType: 'agent',
      actor: agents[0],
      priority: 'normal',
      source: 'system',
    },
  })

  // Performance alerts
  addNotification({
    id: `notif-${id}`,
    type: 'performance_alert',
    message: `Team velocity trending upward: +12% this week`,
    read: true,
    metadata: {
      priority: 'high',
      source: 'analytics',
    },
  })

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
   * Fetch notifications with optional filtering by unread status and type
   * Returns paginated results capped at 20 most recent entries
   * Supports filtering by ?unread=true
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

    // Filter by type (supports both eventType and legacy type)
    if (type) {
      filtered = filtered.filter((n) => n.type === type || n.eventType === type)
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Count unread from all notifications
    const unreadCount = notificationsStore.filter((n) => !n.read).length

    // Cap at 20 most recent entries
    const capped = filtered.slice(0, 20)

    // Apply pagination
    const start = pageIndex * pageSize
    const end = start + pageSize
    const paginated = capped.slice(start, end)

    return HttpResponse.json({
      notifications: paginated,
      unreadCount,
      total: capped.length,
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
