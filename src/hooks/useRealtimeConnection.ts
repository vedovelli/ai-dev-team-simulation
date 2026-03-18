import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  RealtimeEvent,
  ConnectionState,
  EventRouterConfig,
  DEFAULT_EVENT_ROUTES,
} from '../types/realtime'

export interface UseRealtimeConnectionOptions {
  /** WebSocket URL (defaults to auto-detect) */
  wsUrl?: string
  /** Fallback to polling if WebSocket unavailable */
  enablePollingFallback?: boolean
  /** Polling interval in ms (default: 30000) */
  pollingInterval?: number
  /** Max reconnection attempts before fallback (default: 5) */
  maxReconnectAttempts?: number
  /** Initial reconnect delay in ms (default: 1000) */
  initialReconnectDelay?: number
  /** Max reconnect delay in ms (default: 30000) */
  maxReconnectDelay?: number
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number
  /** Custom event routing configuration */
  eventRoutes?: Partial<EventRouterConfig>
  /** Enable debug logging */
  debug?: boolean
  /** Callback on connection state change */
  onStateChange?: (state: ConnectionState) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export interface UseRealtimeConnectionReturn {
  /** Current connection state */
  state: ConnectionState
  /** Whether WebSocket is connected */
  isConnected: boolean
  /** Whether currently using polling fallback */
  isPollingFallback: boolean
  /** Latest error, if any */
  error: Error | null
  /** Manually reconnect */
  reconnect: () => void
  /** Disconnect and stop polling */
  disconnect: () => void
}

/**
 * Custom hook for managing real-time WebSocket connection with automatic
 * reconnection, query invalidation, and graceful polling fallback.
 *
 * Features:
 * - Type-safe event routing with discriminated unions
 * - Automatic exponential backoff reconnection with heartbeat
 * - Smart query invalidation based on event type
 * - Graceful fallback to polling if WebSocket unavailable
 * - Connection state tracking (connecting, open, closed, error)
 *
 * @param options - Configuration options
 * @returns Connection state and control methods
 *
 * @example
 * ```tsx
 * const { state, isConnected, error } = useRealtimeConnection({
 *   wsUrl: 'wss://api.example.com/realtime',
 *   debug: true,
 *   onStateChange: (state) => console.log(`Connection: ${state}`),
 * })
 *
 * return (
 *   <div>
 *     <p>Status: {state}</p>
 *     {error && <p className="error">{error.message}</p>}
 *   </div>
 * )
 * ```
 */
export function useRealtimeConnection(
  options: UseRealtimeConnectionOptions = {}
): UseRealtimeConnectionReturn {
  const {
    wsUrl,
    enablePollingFallback = true,
    pollingInterval = 30000,
    maxReconnectAttempts = 5,
    initialReconnectDelay = 1000,
    maxReconnectDelay = 30000,
    heartbeatInterval = 30000,
    eventRoutes = {},
    debug = false,
    onStateChange,
    onError,
  } = options

  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectDelayRef = useRef(initialReconnectDelay)

  const [state, setState] = useState<ConnectionState>('closed')
  const [error, setError] = useState<Error | null>(null)
  const [isPollingFallback, setIsPollingFallback] = useState(false)

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        console.log(`[RealtimeConnection] ${message}`, data)
      }
    },
    [debug]
  )

  // Route event to query invalidation based on event type
  const routeEvent = useCallback(
    (event: RealtimeEvent) => {
      const routes = { ...DEFAULT_EVENT_ROUTES, ...eventRoutes }
      const queryKeys = routes[event.type]

      if (queryKeys) {
        log(`Routing event ${event.type} to invalidate`, queryKeys)
        queryClient.invalidateQueries({ queryKey: queryKeys })
      }
    },
    [eventRoutes, queryClient, log]
  )

  // Handle incoming WebSocket message
  const handleMessage = useCallback(
    (messageData: string) => {
      try {
        const event: RealtimeEvent = JSON.parse(messageData)
        log('Received event', event)
        routeEvent(event)
      } catch (err) {
        console.error('[RealtimeConnection] Failed to parse message:', err)
      }
    },
    [routeEvent, log]
  )

  // Send heartbeat to keep connection alive
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }))
        log('Heartbeat sent')
      } catch (err) {
        console.error('[RealtimeConnection] Failed to send heartbeat:', err)
      }
    }
  }, [log])

  // Setup heartbeat interval
  const setupHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
    }
    heartbeatTimeoutRef.current = setInterval(sendHeartbeat, heartbeatInterval)
  }, [heartbeatInterval, sendHeartbeat])

  // Handle WebSocket open
  const handleOpen = useCallback(() => {
    log('WebSocket connected')
    setState('open')
    setError(null)
    setIsPollingFallback(false)
    reconnectAttemptsRef.current = 0
    reconnectDelayRef.current = initialReconnectDelay
    setupHeartbeat()
    onStateChange?.('open')
  }, [log, initialReconnectDelay, setupHeartbeat, onStateChange])

  // Handle WebSocket error
  const handleError = useCallback(
    (err: Event | Error) => {
      const error = err instanceof Error ? err : new Error('WebSocket error')
      log('WebSocket error', error.message)
      setError(error)
      setState('error')
      onError?.(error)
      onStateChange?.('error')
    },
    [log, onError, onStateChange]
  )

  // Handle WebSocket close
  const handleClose = useCallback(() => {
    log('WebSocket closed')
    setState('closed')
    onStateChange?.('closed')

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
    }

    // Attempt to reconnect with exponential backoff
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      setState('connecting')
      onStateChange?.('connecting')
      reconnectAttemptsRef.current += 1

      const delay = reconnectDelayRef.current
      log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, delay)

      // Exponential backoff: double the delay, cap at maxReconnectDelay
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        maxReconnectDelay
      )
    } else {
      // Max reconnection attempts exceeded, fallback to polling
      if (enablePollingFallback) {
        log('Max reconnection attempts exceeded, falling back to polling')
        setIsPollingFallback(true)
        startPollingFallback()
      }
    }
  }, [
    log,
    maxReconnectAttempts,
    maxReconnectDelay,
    enablePollingFallback,
    onStateChange,
  ])

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setState('connecting')
      onStateChange?.('connecting')

      const url = wsUrl || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/realtime`
      log(`Connecting to ${url}`)

      const ws = new WebSocket(url)

      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', (e) => handleMessage(e.data))
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)

      wsRef.current = ws
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect')
      handleError(error)
    }
  }, [wsUrl, handleOpen, handleMessage, handleError, handleClose, log, onStateChange])

  // Polling fallback implementation
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const url = wsUrl || `${window.location.protocol}//${window.location.host}/api/realtime/events`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`)
        }

        const events: RealtimeEvent[] = await response.json()
        events.forEach((event) => routeEvent(event))
        log(`Polled and processed ${events.length} events`)
      } catch (err) {
        console.error('[RealtimeConnection] Polling error:', err)
      }
    }, pollingInterval)

    log('Polling fallback started')
  }, [wsUrl, pollingInterval, routeEvent, log])

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    log('Disconnecting')
    setState('closed')
    onStateChange?.('closed')

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.removeEventListener('open', handleOpen)
      wsRef.current.removeEventListener('error', handleError)
      wsRef.current.removeEventListener('close', handleClose)

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
      wsRef.current = null
    }

    setIsPollingFallback(false)
  }, [log, handleOpen, handleError, handleClose, onStateChange])

  // Reconnect: disconnect and connect again
  const reconnect = useCallback(() => {
    log('Manual reconnect requested')
    disconnect()
    reconnectAttemptsRef.current = 0
    reconnectDelayRef.current = initialReconnectDelay
    connectWebSocket()
  }, [disconnect, connectWebSocket, log, initialReconnectDelay])

  // Initialize connection on mount
  useEffect(() => {
    connectWebSocket()

    return () => {
      disconnect()
    }
  }, [connectWebSocket, disconnect])

  return {
    state,
    isConnected: state === 'open',
    isPollingFallback,
    error,
    reconnect,
    disconnect,
  }
}
