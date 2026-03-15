import type { RealtimeTransport, SubscriptionCallback, TransportCapabilities, Unsubscriber } from './types'

export interface WebSocketTransportOptions {
  /** WebSocket URL (e.g., 'wss://api.example.com/realtime') */
  url?: string
}

/**
 * WebSocketTransport stub for real-time subscriptions via WebSocket
 *
 * Implements RealtimeTransport interface for future WebSocket support.
 * Currently a stub that defines the contract and is not active.
 *
 * When implemented, will provide:
 * - Bidirectional communication for low-latency updates
 * - Connection pooling and automatic reconnection
 * - Channel subscription management via WebSocket messages
 *
 * Usage will be identical to PollingTransport:
 * ```tsx
 * const transport = new WebSocketTransport({ url: 'wss://api.example.com' })
 * const unsubscribe = transport.subscribe('notifications', (data) => {
 *   console.log(data)
 * })
 * unsubscribe() // cleanup
 * ```
 */
export class WebSocketTransport implements RealtimeTransport {
  private url: string
  private subscriptions: Map<string, Set<SubscriptionCallback>>

  constructor(options: WebSocketTransportOptions = {}) {
    this.url = options.url ?? 'wss://api.example.com/realtime'
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
      supported: ['polling', 'websocket'],
      preferred: 'websocket',
    }
  }

  /**
   * Cleanup: close WebSocket connection and clear subscriptions
   */
  destroy() {
    this.subscriptions.clear()
  }
}
