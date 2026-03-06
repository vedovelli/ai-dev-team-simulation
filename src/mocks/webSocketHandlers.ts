/**
 * WebSocket Test Infrastructure
 *
 * Provides utilities for testing WebSocket connections, reconnection logic,
 * and integration with TanStack Query. Since MSW doesn't natively support
 * WebSocket mocking, this module uses a combination of jest.mock() and
 * custom test utilities.
 */

import type { WebSocketMessage } from '../hooks/useWebSocket'

/**
 * Mock WebSocket class for testing
 * Simulates WebSocket lifecycle events and message handling
 */
export class MockWebSocket {
  url: string
  readyState: number = WebSocket.CONNECTING
  eventListeners: Map<string, Function[]> = new Map()

  constructor(url: string) {
    this.url = url
    // Simulate immediate connection success
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.dispatchEvent('open', new Event('open'))
    }, 0)
  }

  addEventListener(event: string, listener: EventListener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener as any)
  }

  removeEventListener(event: string, listener: EventListener) {
    if (!this.eventListeners.has(event)) return
    const listeners = this.eventListeners.get(event)!
    const index = listeners.indexOf(listener as any)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close() {
    this.readyState = WebSocket.CLOSING
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED
      this.dispatchEvent('close', new CloseEvent('close'))
    }, 0)
  }

  private dispatchEvent(type: string, event: Event) {
    const listeners = this.eventListeners.get(type) || []
    listeners.forEach((listener) => listener(event))
  }

  // Test helper methods
  simulateMessage<T = any>(message: WebSocketMessage<T>) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(message),
    })
    this.dispatchEvent('message', event)
  }

  simulateError() {
    this.readyState = WebSocket.CLOSED
    this.dispatchEvent('error', new Event('error'))
  }

  simulateDisconnect() {
    this.readyState = WebSocket.CLOSING
    setTimeout(() => {
      this.readyState = WebSocket.CLOSED
      this.dispatchEvent('close', new CloseEvent('close'))
    }, 0)
  }
}

/**
 * Setup WebSocket mocking for tests
 * @example
 * ```tsx
 * beforeEach(() => {
 *   setupWebSocketMock()
 * })
 *
 * afterEach(() => {
 *   cleanupWebSocketMock()
 * })
 * ```
 */
export function setupWebSocketMock() {
  global.WebSocket = MockWebSocket as any
}

/**
 * Cleanup WebSocket mocking
 */
export function cleanupWebSocketMock() {
  if (global.WebSocket === MockWebSocket) {
    delete (global as any).WebSocket
  }
}

/**
 * Helper to create test scenarios for WebSocket reconnection
 * @example
 * ```tsx
 * const scenario = createReconnectionScenario({
 *   failAttempts: 2,
 *   delayBetweenAttempts: 100,
 * })
 * ```
 */
export function createReconnectionScenario(options?: {
  failAttempts?: number
  delayBetweenAttempts?: number
}) {
  const { failAttempts = 0, delayBetweenAttempts = 100 } = options || {}
  let attempts = 0

  return {
    shouldFail: () => {
      const willFail = attempts < failAttempts
      attempts++
      return willFail
    },
    reset: () => {
      attempts = 0
    },
    attempts: () => attempts,
  }
}

/**
 * Simulate exponential backoff delays in tests
 * @example
 * ```tsx
 * const delays = getExponentialBackoffDelays({
 *   initialDelay: 1000,
 *   maxDelay: 30000,
 *   attempts: 5,
 * })
 * // [1000, 2000, 4000, 8000, 16000]
 * ```
 */
export function getExponentialBackoffDelays(options: {
  initialDelay: number
  maxDelay: number
  attempts: number
}): number[] {
  const { initialDelay, maxDelay, attempts } = options
  const delays: number[] = []

  let delay = initialDelay
  for (let i = 0; i < attempts; i++) {
    delays.push(Math.min(delay, maxDelay))
    delay *= 2
  }

  return delays
}

/**
 * Test scenarios for WebSocket lifecycle
 */
export const WebSocketTestScenarios = {
  /**
   * Successful connection and message handling
   */
  successfulConnection: {
    name: 'Successful Connection',
    setup: (ws: MockWebSocket) => {
      ws.addEventListener('open', () => {
        // Auto-send test message on connection
        const message: WebSocketMessage = {
          type: 'test-message',
          payload: { timestamp: Date.now() },
        }
        ws.simulateMessage(message)
      })
    },
  },

  /**
   * Connection failure with reconnection
   */
  connectionFailureWithReconnect: {
    name: 'Connection Failure with Reconnect',
    setup: (ws: MockWebSocket) => {
      setTimeout(() => {
        ws.simulateError()
      }, 100)
    },
  },

  /**
   * Disconnect during active connection
   */
  unexpectedDisconnect: {
    name: 'Unexpected Disconnect',
    setup: (ws: MockWebSocket) => {
      ws.addEventListener('open', () => {
        setTimeout(() => {
          ws.simulateDisconnect()
        }, 200)
      })
    },
  },

  /**
   * Multiple messages in sequence
   */
  multipleMessages: {
    name: 'Multiple Messages',
    setup: (ws: MockWebSocket) => {
      ws.addEventListener('open', () => {
        const messages: WebSocketMessage[] = [
          { type: 'agent-status-update', payload: { agentId: '1', status: 'online' } },
          { type: 'task-assigned', payload: { taskId: '101', agentId: '1' } },
          { type: 'task-completed', payload: { taskId: '101' } },
        ]

        messages.forEach((msg, i) => {
          setTimeout(() => {
            ws.simulateMessage(msg)
          }, 100 * (i + 1))
        })
      })
    },
  },

  /**
   * Malformed message handling
   */
  malformedMessage: {
    name: 'Malformed Message',
    setup: (ws: MockWebSocket) => {
      ws.addEventListener('open', () => {
        // Send invalid JSON
        const event = new MessageEvent('message', {
          data: '{invalid json}',
        })
        const listeners = (ws as any).eventListeners.get('message') || []
        listeners.forEach((listener: Function) => listener(event))
      })
    },
  },
}
