/**
 * MSW Handlers for Activity Feed
 *
 * Provides realistic mock data for:
 * - GET /api/activity/feed - Returns last 50 events
 * - POST /api/activity/:eventId/reactions - Add reaction to event
 */

import { http, HttpResponse, delay } from 'msw'
import type { ActivityEvent, ReactionEmoji } from '../../types/activity'

// Mock event store with reactions
const eventStore: Map<string, ActivityEvent> = new Map()

// Initialize with mock events
function initializeMockEvents() {
  const now = new Date()
  const events: ActivityEvent[] = [
    {
      id: 'evt-1',
      type: 'task_created',
      actor: 'alice',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      metadata: { title: 'Implement authentication system' },
      reactions: { '👍': 3, '❤️': 1 },
    },
    {
      id: 'evt-2',
      type: 'task_assigned',
      actor: 'bob',
      timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
      metadata: { title: 'Design dashboard UI', assignee: 'charlie' },
      reactions: { '🚀': 2 },
    },
    {
      id: 'evt-3',
      type: 'task_completed',
      actor: 'charlie',
      timestamp: new Date(now.getTime() - 1 * 60000).toISOString(),
      metadata: { title: 'Write API tests' },
      reactions: { '👍': 5, '❤️': 2, '🚀': 1 },
    },
    {
      id: 'evt-4',
      type: 'agent_status_change',
      actor: 'agent-alpha',
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      metadata: { status: 'online', previousStatus: 'idle' },
      reactions: {},
    },
  ]

  // Add more events to test virtual scrolling
  for (let i = 0; i < 46; i++) {
    const eventTypes: ActivityEvent['type'][] = [
      'task_created',
      'task_assigned',
      'task_completed',
      'agent_status_change',
    ]
    const type = eventTypes[i % eventTypes.length]
    const timestamp = new Date(
      now.getTime() - (5 + i) * 60000
    ).toISOString()

    events.push({
      id: `evt-${5 + i}`,
      type,
      actor: ['alice', 'bob', 'charlie', 'agent-1', 'agent-2'][i % 5],
      timestamp,
      metadata: {
        title: `Event ${5 + i}`,
      },
      reactions: {},
    })
  }

  events.forEach((event) => {
    eventStore.set(event.id, event)
  })
}

// Initialize on first load
initializeMockEvents()

export const activityHandlers = [
  /**
   * GET /api/activity/feed
   * Returns paginated activity events
   */
  http.get('/api/activity/feed', async ({ request }) => {
    await delay(300)

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const filter = url.searchParams.get('filter')

    // Get all events and sort by timestamp descending
    let events = Array.from(eventStore.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Apply filter if provided
    if (filter) {
      events = events.filter(
        (event) =>
          event.type === filter ||
          event.actor.includes(filter) ||
          (event.metadata?.title &&
            event.metadata.title.toLowerCase().includes(filter.toLowerCase()))
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

    // Update reactions
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
