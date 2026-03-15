import { useEffect, useRef } from 'react'
import type { RealtimeTransport, SubscriptionCallback } from './transports'
import { PollingTransport } from './transports'

export interface UseRealtimeSubscriptionOptions {
  /** Channel to subscribe to (e.g., 'notifications', 'tasks:123') */
  channel: string
  /** Callback when new data arrives */
  onData: SubscriptionCallback
  /** Transport instance to use (default: PollingTransport) */
  transport?: RealtimeTransport
  /** Polling interval in milliseconds, only used if no transport provided (default: 30000) */
  pollInterval?: number
  /** Whether to pause polling when window is hidden (default: true) */
  pauseWhenHidden?: boolean
  /** Enable subscription (default: true) */
  enabled?: boolean
}

/**
 * Hook for real-time subscriptions with transport abstraction
 *
 * Abstracts the transport mechanism from consumers, enabling transparent
 * upgrades from polling to WebSocket/SSE without any component changes.
 *
 * Features:
 * - Clean separation between transport and UI layers
 * - Transport negotiation via server capabilities
 * - Automatic cleanup on unmount or disable
 * - Future-proof for WebSocket/SSE upgrades
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const [data, setData] = useState(null)
 *
 *   useRealtimeSubscription({
 *     channel: 'notifications',
 *     onData: (data) => setData(data),
 *     enabled: true,
 *   })
 *
 *   return <div>{data}</div>
 * }
 * ```
 *
 * To upgrade to WebSocket:
 * ```tsx
 * const wsTransport = new WebSocketTransport({ url: 'wss://api.example.com' })
 *
 * useRealtimeSubscription({
 *   channel: 'notifications',
 *   onData: (data) => setData(data),
 *   transport: wsTransport, // Just change the transport!
 * })
 * ```
 */
export function useRealtimeSubscription(options: UseRealtimeSubscriptionOptions) {
  const {
    channel,
    onData,
    transport: providedTransport,
    pollInterval = 30 * 1000, // 30 seconds
    pauseWhenHidden = true,
    enabled = true,
  } = options

  // Keep transport instance stable across renders
  const transportRef = useRef<RealtimeTransport | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Create default transport if not provided
    if (providedTransport) {
      transportRef.current = providedTransport
    } else if (!transportRef.current) {
      transportRef.current = new PollingTransport({
        interval: pollInterval,
        pauseWhenHidden,
      })
    }

    const transport = transportRef.current
    const unsubscribe = transport.subscribe(channel, onData)

    return () => {
      unsubscribe()
    }
  }, [channel, onData, providedTransport, pollInterval, pauseWhenHidden, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transportRef.current && !providedTransport) {
        // Only destroy if we created the transport
        if ('destroy' in transportRef.current) {
          ;(transportRef.current as any).destroy()
        }
      }
    }
  }, [providedTransport])

  return {
    transport: transportRef.current,
    capabilities: transportRef.current?.getCapabilities(),
  }
}

export type UseRealtimeSubscriptionReturn = ReturnType<typeof useRealtimeSubscription>
