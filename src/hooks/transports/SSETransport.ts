import type { RealtimeTransport, SubscriptionCallback, TransportCapabilities, Unsubscriber } from './types'

export interface SSETransportOptions {
  /** Server-Sent Events endpoint URL (e.g., '/api/realtime/events') */
  url?: string
}

/**
 * SSETransport stub for real-time subscriptions via Server-Sent Events
 *
 * Implements RealtimeTransport interface for future SSE support.
 * Currently a stub that defines the contract and is not active.
 *
 * When implemented, will provide:
 * - One-directional server-to-client updates
 * - Simpler than WebSocket, no connection pooling needed
 * - Built-in automatic reconnection via EventSource API
 * - Channel subscription via query parameters or headers
 *
 * Usage will be identical to PollingTransport:
 * ```tsx
 * const transport = new SSETransport({ url: '/api/realtime/events' })
 * const unsubscribe = transport.subscribe('notifications', (data) => {
 *   console.log(data)
 * })
 * unsubscribe() // cleanup
 * ```
 */
export class SSETransport implements RealtimeTransport {
  private url: string
  private subscriptions: Map<string, Set<SubscriptionCallback>>

  constructor(options: SSETransportOptions = {}) {
    this.url = options.url ?? '/api/realtime/events'
    this.subscriptions = new Map()
  }

  subscribe(channel: string, callback: SubscriptionCallback): Unsubscriber {
    // Get or create subscription for this channel
    let callbacks = this.subscriptions.get(channel)

    if (!callbacks) {
      callbacks = new Set()
      this.subscriptions.set(channel, callbacks)
    }

    // Add callback to the set
    callbacks.add(callback)

    // Return unsubscriber
    return () => {
      callbacks?.delete(callback)

      // Clean up if no more callbacks
      if (callbacks && callbacks.size === 0) {
        this.subscriptions.delete(channel)
      }
    }
  }

  getCapabilities(): TransportCapabilities {
    return {
      supported: ['polling', 'sse'],
      preferred: 'sse',
    }
  }

  /**
   * Cleanup: close event source and clear subscriptions
   */
  destroy() {
    this.subscriptions.clear()
  }
}
