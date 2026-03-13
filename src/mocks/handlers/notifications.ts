import { http, HttpResponse } from 'msw'
import type { Notification, NotificationEventType } from '../../types/notification'

/**
 * Discriminated union type for structured notification messages
 * Ensures type-safe access to event-specific properties
 */
type StructuredMessageItem =
  | { msg: string; eventType: 'assignment_changed'; agentId: string }
  | { msg: string; eventType: 'sprint_updated'; sprintId: string }
  | { msg: string; eventType: 'task_reassigned'; taskId: string }
  | { msg: string; eventType: 'deadline_approaching'; taskId: string; priority: 'high' }

/**
 * Get related ID from a structured message using discriminated unions
 * Type-safe alternative to `as any` casting
 */
function getRelatedId(item: StructuredMessageItem): string {
  switch (item.eventType) {
    case 'assignment_changed':
      return item.agentId
    case 'sprint_updated':
      return item.sprintId
    case 'task_reassigned':
    case 'deadline_approaching':
      return item.taskId
  }
}

/**
 * Track poll count for simulating new notifications between polls
 * Increments with each GET request to /api/notifications
 */
let pollCount = 0

/**
 * Generate richer, more realistic notification data with varied timestamps and event types.
 * Includes: assignment_changed, sprint_updated, task_reassigned, deadline_approaching
 * Also supports legacy types: agent_event, sprint_change, performance_alert
 *
 * Supports multiple scenarios for testing UI components:
 * - default: Mix of read/unread notifications with varied timestamps
 * - burst: Multiple notifications arriving at once (for toast queue stress testing)
 * - empty: No notifications
 * - all-read: All notifications marked as read (for empty state testing)
 */
function generateMockNotifications(scenario: 'default' | 'burst' | 'empty' | 'all-read' = 'default'): Notification[] {
  // Return empty list for 'empty' scenario
  if (scenario === 'empty') {
    return []
  }

  const agents = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
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

  // Rich structured event messages with variety
  const assignmentChangedMessages: Array<StructuredMessageItem> = [
    { msg: 'Task "Implement authentication module" assigned to Agent Alice', eventType: 'assignment_changed', agentId: 'agent-1' },
    { msg: 'Task "Fix database connection pool" reassigned from Bob to Charlie', eventType: 'assignment_changed', agentId: 'agent-3' },
    { msg: 'Task "Email notifications" assigned to Agent Grace', eventType: 'assignment_changed', agentId: 'agent-7' },
    { msg: 'Task "File upload system" unassigned from Henry', eventType: 'assignment_changed', agentId: 'agent-8' },
  ]

  const sprintUpdatedMessages: Array<StructuredMessageItem> = [
    { msg: 'Sprint 5 status changed: Story points velocity updated to 34', eventType: 'sprint_updated', sprintId: 'sprint-5' },
    { msg: 'Sprint 6 backlog refinement scheduled for tomorrow at 2 PM', eventType: 'sprint_updated', sprintId: 'sprint-6' },
    { msg: 'Sprint 7 started with 42 story points', eventType: 'sprint_updated', sprintId: 'sprint-7' },
    { msg: 'Sprint 4 retrospective results: Team recommends async standups', eventType: 'sprint_updated', sprintId: 'sprint-4' },
  ]

  const taskReassignedMessages: Array<StructuredMessageItem> = [
    { msg: 'Task reassigned: "API endpoint refactoring" moved from Alice to Diana', eventType: 'task_reassigned', taskId: 'task-123' },
    { msg: 'Task reassigned: "User profile page" reassigned to Agent Bob', eventType: 'task_reassigned', taskId: 'task-456' },
    { msg: 'Task reassigned: "Database optimization" moved from Charlie to Eve', eventType: 'task_reassigned', taskId: 'task-789' },
  ]

  const deadlineApproachingMessages: Array<StructuredMessageItem> = [
    { msg: 'Deadline approaching: "Complete core features" due in 2 days', eventType: 'deadline_approaching', taskId: 'task-789', priority: 'high' },
    { msg: 'Deadline approaching: "Documentation review" due in 1 day', eventType: 'deadline_approaching', taskId: 'task-101', priority: 'high' },
    { msg: 'Deadline approaching: "Security audit" due in 3 hours', eventType: 'deadline_approaching', taskId: 'task-202', priority: 'high' },
  ]

  const notifications: Notification[] = []
  const now = new Date()
  let notifIndex = 1

  /**
   * Helper to create a notification with proper timestamp and ID alignment.
   * Timestamps are offset such that earlier-created notifications
   * have more recent timestamps (lower index = closer to now).
   * For 'burst' scenario, all notifications get recent timestamps.
   */
  const addNotification = (notif: Omit<Notification, 'timestamp'>, ageMinutes?: number) => {
    let minutesOffset: number

    if (scenario === 'burst') {
      // Burst mode: vary timestamps by only a few seconds (within last minute)
      minutesOffset = Math.random() * 0.5 // 0-30 seconds ago
    } else if (ageMinutes !== undefined) {
      minutesOffset = ageMinutes
    } else {
      // Default: vary from 5 minutes to 2+ hours
      minutesOffset = notifIndex * 5
    }

    notifications.push({
      ...notif,
      timestamp: new Date(now.getTime() - (minutesOffset * 60 * 1000)).toISOString(),
    })
    notifIndex++
  }

  // Add structured event notifications with realistic mix
  const allStructuredMessages = [
    ...assignmentChangedMessages,
    ...sprintUpdatedMessages,
    ...taskReassignedMessages,
    ...deadlineApproachingMessages,
  ]

  allStructuredMessages.forEach((item, idx) => {
    // For 'all-read' scenario, mark everything as read; otherwise ~30% unread (first 4-5)
    const isRead = scenario === 'all-read' ? true : idx >= 4

    addNotification({
      id: `notif-${notifIndex}`,
      type: item.eventType,
      eventType: item.eventType,
      message: item.msg,
      read: isRead,
      priority: 'priority' in item ? item.priority : 'normal',
      relatedId: getRelatedId(item),
      metadata: {
        eventType: item.eventType,
        source: 'system',
        priority: item.priority || 'normal',
      },
    }, idx < 2 ? Math.random() * 15 : undefined) // First 2 are very recent
  })

  // Legacy notification types for backward compatibility
  const legacyAgentEvents = [
    { msg: 'Agent Alice completed task: Implement authentication module', type: 'agent_event' as const },
    { msg: 'Agent Bob started working on: Database optimization', type: 'agent_event' as const },
    { msg: 'Agent Charlie reviewed code changes in: API endpoint refactoring', type: 'agent_event' as const },
  ]

  const legacySprintUpdates = [
    { msg: 'Sprint 4 completed with 92% on-time delivery', type: 'sprint_change' as const },
    { msg: 'New sprint 6 goals approved by team', type: 'sprint_change' as const },
  ]

  const allLegacyMessages = [
    ...legacyAgentEvents,
    ...legacySprintUpdates,
  ]

  allLegacyMessages.forEach((item, idx) => {
    const isRead = scenario === 'all-read' ? true : idx > 1
    addNotification(
      {
        id: `notif-${notifIndex}`,
        type: item.type,
        message: item.msg,
        read: isRead,
        metadata: {
          source: 'system',
          priority: 'normal',
        },
      },
      20 + (idx * 10) // Older notifications
    )
  })

  // Comment added notifications with varied agents
  tasks.slice(0, 3).forEach((task, idx) => {
    const isRead = scenario === 'all-read' ? true : idx > 0
    addNotification(
      {
        id: `notif-${notifIndex}`,
        type: 'comment_added',
        message: `${agents[idx % agents.length]} commented on "${task}"`,
        read: isRead,
        metadata: {
          entityId: `task-${idx + 1}`,
          entityType: 'task',
          actor: agents[idx % agents.length],
          priority: 'normal',
          source: 'system',
        },
      },
      30 + (idx * 5)
    )
  })

  // Sprint lifecycle notifications
  addNotification(
    {
      id: `notif-${notifIndex}`,
      type: 'sprint_started',
      message: `${sprints[2]} has started with sprint goals review`,
      read: scenario === 'all-read' ? true : false,
      metadata: {
        entityId: 'sprint-6',
        entityType: 'sprint',
        priority: 'high',
        source: 'system',
      },
    },
    10
  )

  addNotification(
    {
      id: `notif-${notifIndex}`,
      type: 'sprint_completed',
      message: `${sprints[1]} completed with 92% on-time delivery and 96 story points`,
      read: true,
      metadata: {
        entityId: 'sprint-5',
        entityType: 'sprint',
        priority: 'normal',
        source: 'system',
      },
    },
    40
  )

  // Status change notifications
  addNotification(
    {
      id: `notif-${notifIndex}`,
      type: 'status_changed',
      message: `Task "${tasks[3]}" status changed to In Progress by ${agents[1]}`,
      read: true,
      metadata: {
        entityId: 'task-4',
        entityType: 'task',
        priority: 'normal',
        source: 'system',
      },
    },
    50
  )

  // Agent performance notifications
  addNotification(
    {
      id: `notif-${notifIndex}`,
      type: 'agent_event',
      message: `${agents[0]} completed 5 tasks this week (92% of goal)`,
      read: true,
      metadata: {
        entityId: 'agent-1',
        entityType: 'agent',
        actor: agents[0],
        priority: 'normal',
        source: 'system',
      },
    },
    60
  )

  // Performance alerts
  addNotification(
    {
      id: `notif-${notifIndex}`,
      type: 'performance_alert',
      message: `Team velocity trending upward: +12% this week (38 → 42 points)`,
      read: true,
      metadata: {
        priority: 'high',
        source: 'analytics',
      },
    },
    70
  )

  return notifications
}

// In-memory store for notifications with scenario state
let notificationsStore: Notification[] = generateMockNotifications('default')
let currentScenario: 'default' | 'burst' | 'empty' | 'all-read' = 'default'

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
   *
   * Supports:
   * - Filtering by ?unread=true
   * - Filtering by ?type=<event_type>
   * - Scenario query param: ?scenario=burst|empty|all-read|default
   *   - burst: Multiple notifications arriving at once (stress test)
   *   - empty: No notifications
   *   - all-read: All notifications marked as read
   *   - default: Mix of read/unread with varied timestamps
   * - Pagination with ?pageIndex=0&pageSize=20
   *
   * Simulates new notifications appearing between polls:
   * On even poll counts, adds 1-2 new notifications (newest)
   */
  http.get('/api/notifications', ({ request }) => {
    const url = new URL(request.url)
    const scenario = (url.searchParams.get('scenario') as 'default' | 'burst' | 'empty' | 'all-read') || 'default'
    const unread = url.searchParams.get('unread')
    const type = url.searchParams.get('type')
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '0', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)

    // Regenerate store if scenario changed
    if (scenario !== currentScenario) {
      currentScenario = scenario
      notificationsStore = generateMockNotifications(scenario)
      pollCount = 0 // Reset poll counter for new scenario
    }

    // Simulate new notifications appearing between polls (for 'default' and 'burst' scenarios)
    if ((currentScenario === 'default' || currentScenario === 'burst') && pollCount % 3 === 2) {
      const newNotificationCount = Math.random() > 0.5 ? 1 : 2
      const agents = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']
      const eventTypes: NotificationEventType[] = ['assignment_changed', 'task_reassigned', 'deadline_approaching', 'sprint_updated']

      for (let i = 0; i < newNotificationCount; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        const agent = agents[Math.floor(Math.random() * agents.length)]
        const taskNum = Math.floor(Math.random() * 100)

        let newNotif: Notification | null = null

        switch (eventType) {
          case 'assignment_changed':
            newNotif = {
              id: `notif-new-${Date.now()}-${i}`,
              type: 'assignment_changed',
              eventType: 'assignment_changed',
              message: `Task "${taskNum > 50 ? 'Payment integration' : 'Search optimization'}" assigned to ${agent}`,
              read: false,
              priority: 'normal',
              relatedId: `agent-${Math.floor(Math.random() * 8) + 1}`,
              timestamp: new Date().toISOString(),
              metadata: { eventType: 'assignment_changed', source: 'system', priority: 'normal' },
            }
            break
          case 'task_reassigned':
            newNotif = {
              id: `notif-new-${Date.now()}-${i}`,
              type: 'task_reassigned',
              eventType: 'task_reassigned',
              message: `Task "${taskNum > 50 ? 'API refactoring' : 'UI improvements'}" reassigned to ${agent}`,
              read: false,
              priority: 'normal',
              relatedId: `task-${taskNum}`,
              timestamp: new Date().toISOString(),
              metadata: { eventType: 'task_reassigned', source: 'system', priority: 'normal' },
            }
            break
          case 'deadline_approaching':
            newNotif = {
              id: `notif-new-${Date.now()}-${i}`,
              type: 'deadline_approaching',
              eventType: 'deadline_approaching',
              message: `Deadline approaching: "Sprint ${taskNum % 4 + 4} goals" due ${taskNum % 3 === 0 ? 'in 1 hour' : 'tomorrow'}`,
              read: false,
              priority: 'high',
              relatedId: `task-${taskNum}`,
              timestamp: new Date().toISOString(),
              metadata: { eventType: 'deadline_approaching', source: 'system', priority: 'high' },
            }
            break
          case 'sprint_updated':
            newNotif = {
              id: `notif-new-${Date.now()}-${i}`,
              type: 'sprint_updated',
              eventType: 'sprint_updated',
              message: `Sprint ${taskNum % 4 + 4} checkpoint: ${Math.floor(Math.random() * 50) + 20} points completed`,
              read: false,
              priority: 'normal',
              relatedId: `sprint-${taskNum % 4 + 4}`,
              timestamp: new Date().toISOString(),
              metadata: { eventType: 'sprint_updated', source: 'system', priority: 'normal' },
            }
            break
        }

        if (newNotif) {
          // Add to beginning so it appears as most recent
          notificationsStore.unshift(newNotif)
        }
      }

      // Enforce max 20 notifications cap
      if (notificationsStore.length > 20) {
        notificationsStore = notificationsStore.slice(0, 20)
      }
    }

    pollCount++

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
   * POST /api/notifications/mark-all-read
   * Bulk mark all unread notifications as read
   * Returns count of notifications that were marked as read
   */
  http.post('/api/notifications/mark-all-read', () => {
    let markedCount = 0

    notificationsStore.forEach((notif, idx) => {
      if (!notif.read) {
        notificationsStore[idx] = { ...notif, read: true }
        markedCount++
      }
    })

    return HttpResponse.json({
      success: true,
      markedCount,
      unreadCount: 0,
    })
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
