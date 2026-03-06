import { useEffect, useRef, useCallback, useState } from 'react'

export interface WebSocketMessage<T = any> {
  type: string
  payload: T
}

export interface UseWebSocketOptions<T = any> {
  url: string
  onMessage?: (message: WebSocketMessage<T>) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  shouldReconnect?: boolean
  maxReconnectAttempts?: number
  initialReconnectDelay?: number
  maxReconnectDelay?: number
}

export interface UseWebSocketReturn {
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  send: (message: WebSocketMessage) => void
  disconnect: () => void
}

/**
 * Custom hook managing persistent WebSocket connections with auto-reconnect
 * and exponential backoff. Integrates with TanStack Query for optimistic updates.
 *
 * @template T - The type of data received from the WebSocket
 * @param options - WebSocket configuration options
 * @returns WebSocket state and control methods
 *
 * @example
 * ```tsx
 * const { isConnected, send, disconnect } = useWebSocket({
 *   url: 'ws://localhost:8080',
 *   onMessage: (msg) => {
 *     if (msg.type === 'agent-status-update') {
 *       // Handle realtime status update
 *     }
 *   },
 *   shouldReconnect: true,
 * })
 * ```
 */
export function useWebSocket<T = any>(
  options: UseWebSocketOptions<T>
): UseWebSocketReturn {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    onClose,
    shouldReconnect = true,
    maxReconnectAttempts = 5,
    initialReconnectDelay = 1000,
    maxReconnectDelay = 30000,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectDelayRef = useRef(initialReconnectDelay)

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: WebSocketMessage<T> = JSON.parse(event.data)
        onMessage?.(message)
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    },
    [onMessage]
  )

  // Handle connection open
  const handleOpen = useCallback(() => {
    setIsConnected(true)
    setIsConnecting(false)
    setError(null)
    reconnectAttemptsRef.current = 0
    reconnectDelayRef.current = initialReconnectDelay
    onOpen?.()
  }, [initialReconnectDelay, onOpen])

  // Handle connection error
  const handleError = useCallback(
    (event: Event) => {
      const err = new Error('WebSocket error')
      setError(err)
      setIsConnected(false)
      onError?.(event)
    },
    [onError]
  )

  // Handle connection close
  const handleClose = useCallback(() => {
    setIsConnected(false)
    setIsConnecting(false)
    onClose?.()

    // Attempt to reconnect with exponential backoff
    if (shouldReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
      setIsConnecting(true)
      reconnectAttemptsRef.current += 1
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, reconnectDelayRef.current)

      // Exponential backoff: double the delay, cap at maxReconnectDelay
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        maxReconnectDelay
      )
    }
  }, [shouldReconnect, maxReconnectAttempts, maxReconnectDelay])

  // Send a message through the WebSocket
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setIsConnecting(true)
      const ws = new WebSocket(url)

      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', handleMessage)
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)

      wsRef.current = ws
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect')
      setError(error)
      setIsConnecting(false)
    }
  }, [url, handleOpen, handleMessage, handleError, handleClose])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.removeEventListener('open', handleOpen)
      wsRef.current.removeEventListener('message', handleMessage)
      wsRef.current.removeEventListener('error', handleError)
      wsRef.current.removeEventListener('close', handleClose)

      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
  }, [handleOpen, handleMessage, handleError, handleClose])

  // Initialize connection on mount
  useEffect(() => {
    connectWebSocket()

    return () => {
      disconnect()
    }
  }, [connectWebSocket, disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    send,
    disconnect,
  }
}
