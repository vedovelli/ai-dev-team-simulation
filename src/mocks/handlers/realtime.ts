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
 * MSW handlers for realtime endpoints
 *
 * Currently declares polling as the only supported transport.
 * When upgrading, this can be updated to advertise WebSocket/SSE support
 * without any UI component changes.
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
   * @param channel - Channel name (e.g., 'notifications', 'tasks:123')
   * @returns Latest data for the channel
   */
  http.get('/api/realtime/:channel', ({ params }) => {
    const { channel } = params as { channel: string }

    // Return empty data by default
    // UI components should handle subscription separately
    return HttpResponse.json({ channel, data: null, timestamp: new Date().toISOString() })
  }),
]
