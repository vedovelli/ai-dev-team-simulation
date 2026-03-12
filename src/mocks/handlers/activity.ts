/**
 * MSW Handlers for Activity Feed
 *
 * Provides realistic paginated activity data:
 * - GET /api/activity - Cursor-based pagination with entity filtering
 * - GET /api/activity/feed - Legacy endpoint (for backward compatibility)
 * - POST /api/activity/:eventId/reactions - Add reaction to event
 */

import { http, HttpResponse, delay } from 'msw'
import type { ActivityEvent, ActivityFeedResponse, ReactionEmoji, EntityType } from '../../types/activity'

// Mock event store
const eventStore: Map<string, ActivityEvent> = new Map()

// Initialize with realistic mock events
function initializeMockEvents() {
  const now = new Date()
  const actors = ['alice', 'bob', 'charlie', 'diana', 'eve']
  const agents = ['agent-1', 'agent-2', 'agent-3']

  // Create realistic activity events
  const baseEvents: Partial<ActivityEvent>[] = [
    {
      type: 'task_assigned',
      entityType: 'task',
      actorName: 'alice',
      payload: { taskId: 'task-123', assignee: 'bob', priority: 'high' },
    },
    {
      type: 'task_status_changed',
      entityType: 'task',
      actorName: 'bob',
      payload: { taskId: 'task-123', from: 'todo', to: 'in_progress' },
    },
    {
      type: 'comment_added',
      entityType: 'task',
      actorName: 'charlie',
      payload: { taskId: 'task-123', comment: 'Working on this now', commentId: 'cmt-1' },
    },
    {
      type: 'sprint_updated',
      entityType: 'sprint',
      actorName: 'diana',
      payload: { sprintId: 'sprint-1', field: 'endDate', value: '2026-03-20' },
    },
    {
      type: 'task_assigned',
      entityType: 'task',
      actorName: 'eve',
      payload: { taskId: 'task-456', assignee: 'agent-1' },
    },
  ]

  // Generate 100 events for testing pagination
  let eventId = 1
  for (let i = 0; i < 100; i++) {
    const baseEvent = baseEvents[i % baseEvents.length]
    const timestamp = new Date(now.getTime() - (i + 1) * 5 * 60000) // 5 min apart

    const event: ActivityEvent = {
      id: `evt-${eventId++}`,
      type: baseEvent.type || 'task_assigned',
      entityType: baseEvent.entityType || 'sprint',
      entityId: baseEvent.payload?.taskId || baseEvent.payload?.sprintId || `entity-${i}`,
      actorName: baseEvent.actorName || actors[i % actors.length],
      payload: baseEvent.payload || {},
      createdAt: timestamp.toISOString(),
    }

    eventStore.set(event.id, event)
  }
}

// Initialize on first load
initializeMockEvents()

/**
 * Encode cursor for pagination
 * Cursor is base64-encoded event ID
 */
function encodeCursor(eventId: string): string {
  return Buffer.from(eventId).toString('base64')
}

/**
 * Decode cursor for pagination
 */
function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

export const activityHandlers = [
  /**
   * GET /api/activity
   * Cursor-based paginated activity feed with entity filtering
   *
   * Query params:
   * - entityType: 'sprint' | 'task' | 'agent' (optional)
   * - entityId: string (optional)
   * - cursor: string (optional, base64-encoded)
   * - limit: number (default: 50)
   */
  http.get('/api/activity', async ({ request }) => {
    await delay(300)

    const url = new URL(request.url)
    const entityType = url.searchParams.get('entityType') as EntityType | null
    const entityId = url.searchParams.get('entityId')
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)

    // Get all events sorted by createdAt descending
    let events = Array.from(eventStore.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Filter by entity type if specified
    if (entityType) {
      events = events.filter((e) => e.entityType === entityType)
    }

    // Filter by entity ID if specified
    if (entityId) {
      events = events.filter((e) => e.entityId === entityId)
    }

    // Find starting position from cursor
    let startIndex = 0
    if (cursor) {
      const decodedCursor = decodeCursor(cursor)
      startIndex = events.findIndex((e) => e.id === decodedCursor) + 1
      if (startIndex === 0) {
        // Cursor not found, start from beginning
        startIndex = 0
      }
    }

    // Get page of events
    const pageEvents = events.slice(startIndex, startIndex + limit)
    const hasMore = startIndex + limit < events.length
    const nextCursor = hasMore && pageEvents.length > 0
      ? encodeCursor(pageEvents[pageEvents.length - 1].id)
      : null

    const response: ActivityFeedResponse = {
      events: pageEvents,
      nextCursor,
      hasMore,
    }

    return HttpResponse.json(response)
  }),

  /**
   * GET /api/activity/feed
   * Legacy endpoint for backward compatibility
   * Returns non-paginated feed with optional filter
   */
  http.get('/api/activity/feed', async ({ request }) => {
    await delay(300)

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const filter = url.searchParams.get('filter')

    // Get all events and sort by createdAt descending
    let events = Array.from(eventStore.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Apply filter if provided
    if (filter) {
      events = events.filter(
        (event) =>
          event.type === filter ||
          event.actorName.includes(filter) ||
          JSON.stringify(event.payload).toLowerCase().includes(filter.toLowerCase())
      )
    }

    // Paginate
    const paginatedEvents = events.slice(0, limit)

    return HttpResponse.json({
      data: paginatedEvents,
      total: events.length,
      limit,
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
