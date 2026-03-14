/**
 * MSW Handlers for Activity Feed
 *
 * Provides realistic paginated activity data with temporal and type filtering:
 * - GET /api/activity - Page-based pagination with temporal and type filtering
 * - POST /api/activity/:eventId/reactions - Add reaction to event
 */

import { http, HttpResponse, delay } from 'msw'
import type { ActivityEvent, ReactionEmoji, EntityType } from '../../types/activity'

// Mock event store
const eventStore: Map<string, ActivityEvent> = new Map()

// Initialize with realistic mock events spanning last 30 days
function initializeMockEvents() {
  const now = new Date()
  const actors = ['alice', 'bob', 'charlie', 'diana', 'eve']
  const taskEventTypes: ActivityEvent['type'][] = [
    'task_assigned',
    'task_status_changed',
    'comment_added',
    'task_completed',
  ]
  const sprintEventTypes: ActivityEvent['type'][] = ['sprint_updated', 'sprint_archived']

  // Generate 50-60 events spanning last 30 days with varied event types
  let eventId = 1
  const targetCount = Math.floor(Math.random() * 11) + 50 // 50-60 events

  for (let i = 0; i < targetCount; i++) {
    // Distribute events across last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)

    const timestamp = new Date(now)
    timestamp.setDate(timestamp.getDate() - daysAgo)
    timestamp.setHours(timestamp.getHours() - hoursAgo)
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo)

    // Alternate between task and sprint events
    const isTaskEvent = Math.random() > 0.4
    const eventTypes = isTaskEvent ? taskEventTypes : sprintEventTypes
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]

    const event: ActivityEvent = {
      id: `evt-${eventId++}`,
      type,
      entityType: isTaskEvent ? 'task' : 'sprint',
      entityId: isTaskEvent ? `task-${Math.floor(Math.random() * 10) + 1}` : `sprint-${Math.floor(Math.random() * 3) + 1}`,
      actorName: actors[Math.floor(Math.random() * actors.length)],
      payload: {
        taskId: isTaskEvent ? `task-${Math.floor(Math.random() * 10) + 1}` : undefined,
        sprintId: !isTaskEvent ? `sprint-${Math.floor(Math.random() * 3) + 1}` : undefined,
        field: type === 'sprint_updated' ? ['name', 'endDate', 'status'][Math.floor(Math.random() * 3)] : undefined,
        from: type === 'task_status_changed' ? 'todo' : undefined,
        to: type === 'task_status_changed' ? 'in_progress' : undefined,
      },
      createdAt: timestamp.toISOString(),
    }

    eventStore.set(event.id, event)
  }
}

// Initialize on first load
initializeMockEvents()

/**
 * Filter events by time range
 */
function filterByTimeRange(events: ActivityEvent[], timeRange: string): ActivityEvent[] {
  const now = new Date()
  let daysBack = 7 // Default to 7 days

  if (timeRange === '24h') {
    daysBack = 1
  } else if (timeRange === '30d') {
    daysBack = 30
  }

  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  return events.filter((event) => new Date(event.createdAt) >= cutoffDate)
}

/**
 * Filter events by type
 */
function filterByEventType(
  events: ActivityEvent[],
  eventType: string
): ActivityEvent[] {
  if (eventType === 'task') {
    return events.filter((e) => e.entityType === 'task')
  }
  if (eventType === 'sprint') {
    return events.filter((e) => e.entityType === 'sprint')
  }
  return events // 'all' or unspecified
}

export const activityHandlers = [
  /**
   * GET /api/activity
   * Page-based paginated activity feed with temporal and type filtering
   *
   * Query params:
   * - page: number (default: 1)
   * - limit: number (default: 20)
   * - timeRange: '24h' | '7d' | '30d' (default: '7d')
   * - eventType: 'task' | 'sprint' | 'all' (default: 'all')
   */
  http.get('/api/activity', async ({ request }) => {
    await delay(300)

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
    const timeRange = url.searchParams.get('timeRange') || '7d'
    const eventType = url.searchParams.get('eventType') || 'all'

    // Get all events sorted by createdAt descending
    let events = Array.from(eventStore.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Apply temporal filter
    events = filterByTimeRange(events, timeRange)

    // Apply event type filter
    events = filterByEventType(events, eventType)

    // Calculate pagination
    const total = events.length
    const startIndex = (page - 1) * limit
    const pageEvents = events.slice(startIndex, startIndex + limit)

    return HttpResponse.json({
      data: pageEvents,
      total,
      page,
      pageSize: limit,
    })
  }),

  /**
   * POST /api/activity/:eventId/reactions
   * Add a reaction to an event
   */
  http.post('/api/activity/:eventId/reactions', async ({ params, request }) => {
    await delay(200)

    const { eventId } = params as { eventId: string }
    const body = (await request.json()) as { emoji: ReactionEmoji }

    const event = eventStore.get(eventId)
    if (!event) {
      return HttpResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Update reactions (in a real app, these would be persisted)
    const reactions = event.reactions || {}
    reactions[body.emoji] = (reactions[body.emoji] || 0) + 1

    const updatedEvent: ActivityEvent = {
      ...event,
      reactions,
    }

    eventStore.set(eventId, updatedEvent)

    return HttpResponse.json({
      data: updatedEvent,
    })
  }),
]
