/**
 * Transport type identifier
 */
export type TransportType = 'polling' | 'websocket' | 'sse'

/**
 * Capabilities advertised by a realtime transport
 */
export interface TransportCapabilities {
  /** List of supported transport types */
  supported: TransportType[]
  /** Preferred transport type */
  preferred: TransportType
}

/**
 * Callback invoked when new data arrives on a channel
 */
export type SubscriptionCallback = (data: unknown) => void

/**
 * Unsubscribe function returned by transport.subscribe()
 */
export type Unsubscriber = () => void

/**
 * Base interface for realtime transports
 *
 * All transports implement this contract, enabling transparent
 * upgrades from polling to WebSocket/SSE without UI changes.
 */
export interface RealtimeTransport {
  /**
   * Subscribe to updates on a channel
   *
   * @param channel - Channel name (e.g., 'notifications', 'tasks:123')
   * @param callback - Invoked when new data arrives
   * @returns Unsubscriber function to cancel subscription
   */
  subscribe(channel: string, callback: SubscriptionCallback): Unsubscriber

  /**
   * Get capabilities of this transport
   *
   * @returns Transport capabilities including supported types and preference
   */
  getCapabilities(): TransportCapabilities
}
