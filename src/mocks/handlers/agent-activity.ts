/**
 * MSW Handlers for Agent Activity Feed
 *
 * Provides realistic agent activity data with cursor-based pagination and time-range filtering:
 * - GET /api/agents/:agentId/activity - Cursor-based paginated activity events
 */

import { http, HttpResponse, delay } from 'msw'
import type { ActivityEvent } from '../../hooks/useAgentActivity'

// Mock event store per agent
const eventStoreByAgent: Map<string, ActivityEvent[]> = new Map()

/**
 * Generate a cursor token from an event
 * Format: base64-encoded "timestamp:id" for realistic cursor behavior
 */
function generateCursor(event: ActivityEvent): string {
  const token = `${event.timestamp}:${event.id}`
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
 * Initialize mock activity events for an agent
 * Generates ~50 realistic events spanning the last 30 days with varied types
 */
function initializeAgentActivity(agentId: string): ActivityEvent[] {
  if (eventStoreByAgent.has(agentId)) {
    return eventStoreByAgent.get(agentId)!
  }

  const now = new Date()
  const events: ActivityEvent[] = []

  const eventTypes: ActivityEvent['type'][] = [
    'task_assigned',
    'task_completed',
    'task_status_changed',
    'task_comment',
    'assignment_changed',
  ]

  const taskIds = Array.from({ length: 10 }, (_, i) => `task-${i + 1}`)
  const descriptions = {
    task_assigned: (taskId: string) => `Task ${taskId} assigned to you`,
    task_completed: (taskId: string) => `Task ${taskId} marked as complete`,
    task_status_changed: (taskId: string) => `Task ${taskId} status changed to in_progress`,
    task_comment: (taskId: string) => `New comment on task ${taskId}`,
    assignment_changed: (taskId: string) => `Task ${taskId} reassigned from agent-2 to you`,
  }

  // Generate 50-60 events spanning last 30 days
  const targetCount = Math.floor(Math.random() * 11) + 50

  for (let i = 0; i < targetCount; i++) {
    // Distribute events across last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const hoursAgo = Math.floor(Math.random() * 24)
    const minutesAgo = Math.floor(Math.random() * 60)

    const timestamp = new Date(now)
    timestamp.setDate(timestamp.getDate() - daysAgo)
    timestamp.setHours(timestamp.getHours() - hoursAgo)
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo)

    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const relatedTaskId = taskIds[Math.floor(Math.random() * taskIds.length)]

    const event: ActivityEvent = {
      id: `evt-${agentId}-${i + 1}`,
      type,
      description: descriptions[type](relatedTaskId),
      timestamp: timestamp.toISOString(),
      relatedEntityId: relatedTaskId,
    }

    events.push(event)
  }

  // Sort by timestamp descending (most recent first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  eventStoreByAgent.set(agentId, events)
  return events
}

/**
 * Filter events by time range
 */
function filterByTimeRange(
  events: ActivityEvent[],
  timeRange: string | undefined,
  fromDate: string | undefined,
  toDate: string | undefined
): ActivityEvent[] {
  const now = new Date()
  let cutoffDate = new Date(now)

  if (fromDate && toDate) {
    // Custom date range
    cutoffDate = new Date(fromDate)
    const endDate = new Date(toDate)
    return events.filter((event) => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= cutoffDate && eventDate <= endDate
    })
  }

  // Predefined time ranges
  if (timeRange === '7d') {
    cutoffDate.setDate(cutoffDate.getDate() - 7)
  } else if (timeRange === '30d') {
    cutoffDate.setDate(cutoffDate.getDate() - 30)
  }

  return events.filter((event) => new Date(event.timestamp) >= cutoffDate)
}

export const agentActivityHandlers = [
  /**
   * GET /api/agents/:agentId/activity
   * Cursor-based paginated agent activity feed with time-range filtering
   *
   * Query params:
   * - cursor: string (optional, for pagination)
   * - pageSize: number (default: 20, max: 100)
   * - timeRange: '7d' | '30d' (default: '7d')
   * - fromDate: ISO date string (overrides timeRange)
   * - toDate: ISO date string (overrides timeRange)
   */
  http.get('/api/agents/:agentId/activity', async ({ params, request }) => {
    await delay(200)

    const { agentId } = params as { agentId: string }
    const url = new URL(request.url)

    const cursor = url.searchParams.get('cursor')
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100)
    const timeRange = url.searchParams.get('timeRange') || '7d'
    const fromDate = url.searchParams.get('fromDate')
    const toDate = url.searchParams.get('toDate')

    // Initialize events for this agent
    let allEvents = initializeAgentActivity(agentId)

    // Apply time-range filter
    allEvents = filterByTimeRange(allEvents, timeRange, fromDate, toDate)

    // Find starting position based on cursor
    let startIndex = 0
    if (cursor) {
      const decodedCursor = decodeCursor(cursor)
      if (decodedCursor) {
        startIndex = allEvents.findIndex((e) => e.id === decodedCursor.id)
        if (startIndex !== -1) {
          startIndex += 1 // Start after the cursor position
        } else {
          startIndex = 0
        }
      }
    }

    // Get page of events
    const pageEvents = allEvents.slice(startIndex, startIndex + pageSize)

    // Determine if there are more events
    const hasMore = startIndex + pageSize < allEvents.length
    const nextCursor = hasMore && pageEvents.length > 0 ? generateCursor(pageEvents[pageEvents.length - 1]) : null

    return HttpResponse.json({
      events: pageEvents,
      nextCursor,
      hasMore,
    })
  }),
]
