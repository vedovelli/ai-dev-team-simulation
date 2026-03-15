/**
 * PollingTransport — Default notification transport
 *
 * Fetches notifications on a regular interval.
 * Delegates to the existing notification API polling mechanism.
 */

import type {
  NotificationTransport,
  NotificationEvent,
  TransportStatus,
} from '../types/notification-transport'
import type { Notification } from '../types/notification'

interface PollingTransportConfig {
  /** Polling interval in milliseconds */
  interval?: number
  /** Fetch function to retrieve notifications */
  fetchNotifications: () => Promise<Notification[]>
  /** Optional callback when fetch fails */
  onError?: (error: Error) => void
}

/**
 * PollingTransport implementation
 *
 * Implements NotificationTransport using periodic polling.
 * Current default transport — will be replaceable with WebSocketTransport.
 */
export class PollingTransport implements NotificationTransport {
  private config: Required<PollingTransportConfig>
  private status: TransportStatus = 'disconnected'
  private pollingInterval: NodeJS.Timeout | null = null
  private subscribers: ((event: NotificationEvent) => void)[] = []
  private lastNotifications: Map<string, Notification> = new Map()
  private sequence = 0
  private isActive = false

  constructor(config: PollingTransportConfig) {
    this.config = {
      interval: config.interval ?? 30000, // 30s default
      fetchNotifications: config.fetchNotifications,
      onError: config.onError ?? (() => {}),
    }
  }

  /**
   * Subscribe to notifications
   *
   * Starts polling on first subscription if not already active.
   */
  subscribe(callback: (event: NotificationEvent) => void): () => void {
    this.subscribers.push(callback)

    // Start polling on first subscriber
    if (!this.isActive) {
      this.isActive = true
      this.status = 'connecting'
      this.poll()
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
      // Stop polling if no more subscribers
      if (this.subscribers.length === 0) {
        this.stopPolling()
      }
    }
  }

  /**
   * Get current transport status
   */
  getStatus(): TransportStatus {
    return this.status
  }

  /**
   * Reconnect transport
   *
   * Useful for manual reconnection after network issues.
   */
  reconnect(): void {
    if (!this.isActive) {
      return
    }

    this.stopPolling()
    this.status = 'connecting'
    this.lastNotifications.clear()
    this.poll()
  }

  /**
   * Disconnect transport
   */
  disconnect(): void {
    this.stopPolling()
    this.isActive = false
    this.subscribers = []
    this.lastNotifications.clear()
  }

  /**
   * Private: Execute polling cycle
   */
  private async poll(): Promise<void> {
    try {
      this.status = 'connecting'
      const notifications = await this.config.fetchNotifications()
      this.status = 'connected'

      // Emit new or updated notifications
      notifications.forEach((notification) => {
        const notificationId = notification.id
        const lastNotification = this.lastNotifications.get(notificationId)

        // Only emit if new or changed (by comparing read status)
        if (
          !lastNotification ||
          lastNotification.read !== notification.read ||
          lastNotification.timestamp !== notification.timestamp
        ) {
          const event: NotificationEvent = {
            ...notification,
            emittedAt: new Date().toISOString(),
            sequence: this.sequence++,
          }

          this.lastNotifications.set(notificationId, notification)
          this.emit(event)
        }
      })
    } catch (error) {
      this.status = 'disconnected'
      const err = error instanceof Error ? error : new Error(String(error))
      this.config.onError(err)
    } finally {
      // Schedule next poll
      if (this.isActive && this.subscribers.length > 0) {
        this.pollingInterval = setTimeout(
          () => this.poll(),
          this.config.interval
        )
      }
    }
  }

  /**
   * Private: Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  /**
   * Private: Emit event to all subscribers
   */
  private emit(event: NotificationEvent): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in notification subscriber:', error)
      }
    })
  }
}
