/**
 * Notification Transport Layer
 *
 * Abstracts the notification delivery mechanism (polling today, WebSocket tomorrow).
 * Allows swapping transport implementations without affecting consumers.
 */

import type { Notification } from './notification'

/**
 * Transport status enum
 */
export type TransportStatus = 'connecting' | 'connected' | 'disconnected'

/**
 * Notification event emitted by a transport
 * Extends base Notification with event metadata
 */
export interface NotificationEvent extends Notification {
  /** Timestamp when event was emitted */
  emittedAt: string
  /** Transport-specific sequence number for ordering */
  sequence?: number
}

/**
 * NotificationTransport interface
 *
 * Defines the contract for notification delivery mechanisms.
 * Implementations can use polling, WebSocket, Server-Sent Events, etc.
 */
export interface NotificationTransport {
  /**
   * Subscribe to notification events
   *
   * @param callback Function called when a notification event is received
   * @returns Unsubscribe function to stop listening
   */
  subscribe(callback: (event: NotificationEvent) => void): () => void

  /**
   * Get current transport status
   *
   * @returns Current connection status
   */
  getStatus(): TransportStatus

  /**
   * Attempt to reconnect
   *
   * Used after network interruption or manual reconnection request.
   * Should be idempotent — calling multiple times is safe.
   */
  reconnect(): void

  /**
   * Clean up and disconnect
   *
   * Called when transport is being destroyed.
   * Optional — implementations may no-op if cleanup is handled elsewhere.
   */
  disconnect?(): void
}

/**
 * Configuration for injecting custom transport
 */
export interface TransportConfig {
  /** Transport implementation to use. Defaults to PollingTransport. */
  transport?: NotificationTransport
  /** Optional polling interval in ms (only used by PollingTransport) */
  pollingInterval?: number
}
