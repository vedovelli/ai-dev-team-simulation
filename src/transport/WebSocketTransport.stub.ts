/**
 * WebSocketTransport — Stub implementation
 *
 * This is a spike — defines the interface contract for future WebSocket implementation.
 * Full implementation deferred until WebSocket upgrade is prioritized.
 *
 * ### Implementation Strategy
 *
 * When implementing WebSocketTransport, follow these patterns:
 *
 * 1. **Connection Management**
 *    - Use browser's native WebSocket API
 *    - Track connection state: connecting → connected → disconnected
 *    - Emit status changes to subscribers
 *    - Handle reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
 *
 * 2. **Message Protocol**
 *    - Server sends JSON: `{ type: 'notification', data: NotificationEvent }`
 *    - Handle heartbeat messages: `{ type: 'ping' }` → respond `{ type: 'pong' }`
 *    - Handle server messages: `{ type: 'reconnect' }` → close and reconnect
 *    - Handle errors: `{ type: 'error', error: string }`
 *
 * 3. **Event Emission**
 *    - Convert server messages to NotificationEvent format
 *    - Add emittedAt timestamp (server-sent or local)
 *    - Maintain sequence number for ordering
 *    - Filter duplicates based on notification.id
 *
 * 4. **Lifecycle**
 *    - subscribe(): Create WebSocket if not exists, add callback, return unsubscribe
 *    - getStatus(): Return current connection state
 *    - reconnect(): Close and recreate WebSocket
 *    - disconnect(): Close WebSocket, clear subscribers, reset state
 *
 * 5. **Error Handling**
 *    - Catch connection errors, log via onError callback
 *    - Implement auto-reconnect with backoff on unexpected close (code !== 1000)
 *    - Don't reconnect if disconnect() was called explicitly
 *    - Timeout connection attempt after 5s, fallback to reconnect
 *
 * 6. **Testing Considerations**
 *    - Inject WebSocket constructor for mocking in tests
 *    - Mock server message simulation for unit tests
 *    - Use MSW (Mock Service Worker) with WebSocket adapter for integration tests
 *
 * ### Configuration
 *
 * ```typescript
 * interface WebSocketTransportConfig {
 *   url: string                              // WebSocket server URL (e.g., wss://api.example.com/notifications)
 *   reconnectInterval?: number              // Base reconnect delay (default 1000ms)
 *   maxReconnectAttempts?: number           // Max reconnect tries before giving up (default: Infinity)
 *   heartbeatInterval?: number              // Send ping every N ms (default 30000ms)
 *   onError?: (error: Error) => void       // Error callback
 * }
 * ```
 *
 * ### Migration Path
 *
 * To upgrade from PollingTransport to WebSocketTransport:
 *
 * ```typescript
 * // Before (current)
 * const transport = new PollingTransport({ ... })
 *
 * // After (drop-in replacement)
 * const transport = new WebSocketTransport({
 *   url: 'wss://api.example.com/ws/notifications',
 *   // ...
 * })
 *
 * // No consumer changes needed — NotificationTransport interface stays the same
 * ```
 */

import type {
  NotificationTransport,
  NotificationEvent,
  TransportStatus,
} from '../types/notification-transport'

/**
 * WebSocketTransport — Stub
 *
 * This stub defines the expected interface but does not implement full functionality.
 * See comments above for implementation strategy.
 *
 * @throws Error - This is a stub and cannot be instantiated
 */
export class WebSocketTransport implements NotificationTransport {
  constructor() {
    throw new Error(
      'WebSocketTransport is not implemented yet. This is a stub for future development. Use PollingTransport for now.'
    )
  }

  // TODO: Implement connection management
  // - private ws: WebSocket | null
  // - private status: TransportStatus
  // - private subscribers: Set<(event: NotificationEvent) => void>
  // - private reconnectAttempts: number
  // - private reconnectBackoff: ExponentialBackoff

  // TODO: Implement subscribe()
  // - Create WebSocket if needed
  // - Add callback to subscribers
  // - Return unsubscribe function

  subscribe(_callback: (event: NotificationEvent) => void): () => void {
    throw new Error('WebSocketTransport.subscribe() not implemented')
  }

  // TODO: Implement getStatus()
  // - Return current connection state

  getStatus(): TransportStatus {
    throw new Error('WebSocketTransport.getStatus() not implemented')
  }

  // TODO: Implement reconnect()
  // - Close existing connection
  // - Reset state
  // - Create new WebSocket with backoff

  reconnect(): void {
    throw new Error('WebSocketTransport.reconnect() not implemented')
  }

  // TODO: Implement disconnect()
  // - Close WebSocket
  // - Clear subscribers
  // - Reset state

  disconnect?(): void {
    throw new Error('WebSocketTransport.disconnect() not implemented')
  }

  // TODO: Implement private connect()
  // - Create WebSocket
  // - Attach event handlers
  // - Implement heartbeat

  // TODO: Implement private handleMessage(data: string)
  // - Parse JSON
  // - Handle different message types (notification, ping, reconnect, error)
  // - Emit NotificationEvent to subscribers

  // TODO: Implement private handleError(error: Event | Error)
  // - Log via onError callback
  // - Update status to disconnected
  // - Attempt reconnect with backoff

  // TODO: Implement private emit(event: NotificationEvent)
  // - Call all subscribers
  // - Handle subscriber errors gracefully
}
