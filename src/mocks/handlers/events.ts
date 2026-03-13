import { http, HttpResponse } from 'msw'

/**
 * Event types that trigger cache invalidation
 */
export type PendingEventType = 'task_completed' | 'task_updated' | 'sprint_updated' | 'agent_reassigned' | 'notification_created'

/**
 * A single pending event with type, payload, and timestamp
 */
export interface PendingEvent {
  type: PendingEventType
  payload: Record<string, unknown>
  timestamp: string
}

/**
 * Response from the pending events endpoint
 * Returns events since the requested timestamp and a cursor for next poll
 */
export interface PendingEventsResponse {
  events: PendingEvent[]
  cursor: string // opaque, for next poll
}

/**
 * Track last cursor per sprint to simulate stateful polling
 * In a real system, this would be stored server-side
 */
const sprintEventCursors = new Map<string, number>()

/**
 * Get or initialize event cursor for a sprint
 */
function getEventCursor(sprintId: string): number {
  return sprintEventCursors.get(sprintId) ?? Date.now()
}

/**
 * Update event cursor for a sprint after returning events
 */
function setEventCursor(sprintId: string, timestamp: number): void {
  sprintEventCursors.set(sprintId, timestamp)
}

/**
 * Generate realistic mock events with 30% probability of generating 0-3 events per poll
 */
function generateMockEvents(sprintId: string): PendingEvent[] {
  // 30% probability of generating events
  if (Math.random() > 0.3) {
    return []
  }

  // Generate 0-3 events
  const eventCount = Math.floor(Math.random() * 4)
  const events: PendingEvent[] = []
  const eventTypes: PendingEventType[] = ['task_completed', 'task_updated', 'sprint_updated', 'agent_reassigned', 'notification_created']

  for (let i = 0; i < eventCount; i++) {
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const now = new Date().toISOString()

    let payload: Record<string, unknown> = {}

    switch (type) {
      case 'task_completed':
      case 'task_updated':
        payload = {
          taskId: `task-${Math.floor(Math.random() * 1000)}`,
          sprintId,
          status: type === 'task_completed' ? 'done' : 'in_progress',
        }
        break
      case 'sprint_updated':
        payload = {
          sprintId,
          status: 'active',
        }
        break
      case 'agent_reassigned':
        payload = {
          taskId: `task-${Math.floor(Math.random() * 1000)}`,
          agentId: `agent-${Math.floor(Math.random() * 10)}`,
          sprintId,
        }
        break
      case 'notification_created':
        payload = {
          notificationId: `notif-${Math.floor(Math.random() * 1000)}`,
          sprintId,
        }
        break
    }

    events.push({
      type,
      payload,
      timestamp: now,
    })
  }

  return events
}

export const eventsHandlers = [
  /**
   * GET /api/events/pending?since=<timestamp>
   * Returns pending events since the given timestamp
   * Simulates cursor-based pagination for real-time event streaming
   */
  http.get('/api/events/pending', ({ request }) => {
    const url = new URL(request.url)
    const since = url.searchParams.get('since')
    const sprintId = url.searchParams.get('sprintId') || 'default'

    // Get the current cursor for this sprint
    const cursor = getEventCursor(sprintId)

    // Generate mock events
    const events = generateMockEvents(sprintId)

    // Update cursor to current time for next poll
    setEventCursor(sprintId, Date.now())

    return HttpResponse.json<PendingEventsResponse>(
      {
        events,
        cursor: btoa(JSON.stringify({ sprintId, timestamp: Date.now() })), // opaque cursor
      },
      { status: 200 }
    )
  }),
]
