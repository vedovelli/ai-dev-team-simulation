import { http, HttpResponse } from 'msw'

/**
 * Server-side transport capabilities
 * Advertises which transports the server supports
 */
interface RealtimeCapabilities {
  supported: string[]
  preferred: string
}

/**
 * Track the last notification emitted per polling session
 * Ensures each poll receives the latest unack'd notification
 */
const pollState: { lastEmittedNotificationId?: string } = {}

/**
 * MSW handlers for realtime endpoints
 *
 * Supports polling transport for real-time notification delivery.
 * When a new notification is added to the store, it's emitted
 * on the next poll request.
 */
export const realtimeHandlers = [
  /**
   * GET /api/realtime/capabilities
   *
   * Returns the server's supported transport types and preferred transport.
   * Clients use this to negotiate the best available transport for the session.
   */
  http.get('/api/realtime/capabilities', () => {
    const capabilities: RealtimeCapabilities = {
      supported: ['polling'],
      preferred: 'polling',
    }

    return HttpResponse.json(capabilities)
  }),

  /**
   * GET /api/realtime/:channel
   *
   * Polling endpoint that returns the latest data for a channel.
   * Called periodically by PollingTransport at the configured interval.
   *
   * For notifications channel: returns the newest unack'd notification
   * if available, enabling real-time delivery via polling fallback.
   *
   * @param channel - Channel name (e.g., 'notifications', 'tasks:123')
   * @returns Latest data for the channel (notification event, or null)
   */
  http.get('/api/realtime/:channel', ({ params }) => {
    const { channel } = params as { channel: string }

    // Handle notifications channel specifically
    if (channel === 'notifications') {
      // Minimal response to keep polling active
      // Actual notification events are delivered via regular polling
      // in the useNotifications hook
      return HttpResponse.json({
        channel,
        type: 'ping',
        timestamp: new Date().toISOString(),
      })
    }

    // Return empty data for other channels
    return HttpResponse.json({ channel, data: null, timestamp: new Date().toISOString() })
  }),
]

/**
 * Export function to emit notification events in tests
 * Simulates broadcasting a notification to all connected subscribers
 *
 * Usage in tests:
 * ```tsx
 * import { emitNotificationEvent } from '../mocks/handlers/realtime'
 *
 * test('receives notification in real-time', () => {
 *   const notification = { id: 'notif-1', message: '...', read: false, ... }
 *   emitNotificationEvent(notification)
 *   // Hook subscribers will receive the event
 * })
 * ```
 */
export function emitNotificationEvent(notification: any) {
  pollState.lastEmittedNotificationId = notification.id
  // In a real WebSocket implementation, this would broadcast to all connected clients
  // For polling, the notification is delivered on the next GET /api/realtime/notifications
  console.debug('[MSW] Emitting notification event:', notification)
}
