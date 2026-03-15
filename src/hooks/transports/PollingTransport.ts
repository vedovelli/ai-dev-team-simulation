import type { RealtimeTransport, SubscriptionCallback, TransportCapabilities, Unsubscriber } from './types'

export interface PollingTransportOptions {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  interval?: number
  /** Whether to pause polling when window is hidden (default: true) */
  pauseWhenHidden?: boolean
}

/**
 * PollingTransport wraps an HTTP polling mechanism for real-time subscriptions
 *
 * Implements RealtimeTransport interface for backward-compatible upgrades.
 * Fetches fresh data on a recurring interval, suitable for low-latency
 * scenarios and scenarios where WebSocket/SSE is unavailable.
 *
 * Features:
 * - Configurable polling interval
 * - Auto-pauses when document is hidden
 * - Cleans up intervals on unsubscribe
 */
export class PollingTransport implements RealtimeTransport {
  private interval: number
  private pauseWhenHidden: boolean
  private subscriptions: Map<string, { callbacks: Set<SubscriptionCallback>; timerId: NodeJS.Timeout | null }>
  private isVisible: boolean

  constructor(options: PollingTransportOptions = {}) {
    this.interval = options.interval ?? 30 * 1000 // 30 seconds
    this.pauseWhenHidden = options.pauseWhenHidden ?? true
    this.subscriptions = new Map()
    this.isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true

    // Setup visibility listener
    if (this.pauseWhenHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
  }

  private handleVisibilityChange() {
    this.isVisible = document.visibilityState === 'visible'

    // Resume or pause all active subscriptions
    this.subscriptions.forEach((subscription, channel) => {
      if (this.isVisible) {
        this.startPolling(channel, subscription)
      } else {
        this.stopPolling(subscription)
      }
    })
  }

  private startPolling(
    channel: string,
    subscription: { callbacks: Set<SubscriptionCallback>; timerId: NodeJS.Timeout | null }
  ) {
    if (subscription.timerId !== null) {
      return // Already polling
    }

    subscription.timerId = setInterval(() => {
      this.poll(channel, subscription.callbacks)
    }, this.interval)

    // Poll immediately
    this.poll(channel, subscription.callbacks)
  }

  private stopPolling(subscription: { callbacks: Set<SubscriptionCallback>; timerId: NodeJS.Timeout | null }) {
    if (subscription.timerId !== null) {
      clearInterval(subscription.timerId)
      subscription.timerId = null
    }
  }

  private async poll(channel: string, callbacks: Set<SubscriptionCallback>) {
    try {
      const response = await fetch(`/api/realtime/${channel}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Invoke all callbacks with the fetched data
      callbacks.forEach((callback) => {
        callback(data)
      })
    } catch (error) {
      // Silently fail — consumers should implement their own error handling
      console.debug(`[PollingTransport] Poll error on channel '${channel}':`, error)
    }
  }

  subscribe(channel: string, callback: SubscriptionCallback): Unsubscriber {
    // Get or create subscription for this channel
    let subscription = this.subscriptions.get(channel)

    if (!subscription) {
      subscription = {
        callbacks: new Set(),
        timerId: null,
      }
      this.subscriptions.set(channel, subscription)
    }

    // Add callback to the set
    subscription.callbacks.add(callback)

    // Start polling if not already started and window is visible
    if (subscription.timerId === null && this.isVisible) {
      this.startPolling(channel, subscription)
    }

    // Return unsubscriber
    return () => {
      subscription?.callbacks.delete(callback)

      // Clean up if no more callbacks
      if (subscription && subscription.callbacks.size === 0) {
        this.stopPolling(subscription)
        this.subscriptions.delete(channel)
      }
    }
  }

  getCapabilities(): TransportCapabilities {
    return {
      supported: ['polling'],
      preferred: 'polling',
    }
  }

  /**
   * Cleanup: stop all polling intervals and remove event listeners
   */
  destroy() {
    // Clear all subscriptions
    this.subscriptions.forEach((subscription) => {
      this.stopPolling(subscription)
    })
    this.subscriptions.clear()

    // Remove visibility listener
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
  }
}
