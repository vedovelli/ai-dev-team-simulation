import { renderHook, act, waitFor } from '@testing-library/react'
import { useWebSocket, type WebSocketMessage } from '../useWebSocket'
import { MockWebSocket, setupWebSocketMock, cleanupWebSocketMock } from '../../mocks/webSocketHandlers'

describe('useWebSocket', () => {
  let mockWs: MockWebSocket

  beforeEach(() => {
    setupWebSocketMock()
    jest.useFakeTimers()
  })

  afterEach(() => {
    cleanupWebSocketMock()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
      })
    )

    expect(result.current.isConnected).toBe(false)
    expect(result.current.isConnecting).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('should connect to WebSocket and trigger onOpen callback', async () => {
    const onOpen = jest.fn()

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        onOpen,
      })
    )

    // Fast-forward to trigger connection
    jest.runAllTimers()

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
      expect(result.current.isConnecting).toBe(false)
    })

    expect(onOpen).toHaveBeenCalled()
  })

  it('should handle incoming messages', async () => {
    const onMessage = jest.fn()
    let capturedWs: MockWebSocket | null = null

    // Capture the WebSocket instance created by the hook
    const OriginalWebSocket = global.WebSocket
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url)
        capturedWs = this
      }
    } as any

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        onMessage,
      })
    )

    jest.runAllTimers()

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Simulate incoming message through the captured instance
    const testMessage: WebSocketMessage = {
      type: 'test-message',
      payload: { data: 'test' },
    }

    act(() => {
      ;(capturedWs as any).simulateMessage(testMessage)
    })

    expect(onMessage).toHaveBeenCalledWith(testMessage)
    expect(onMessage).toHaveBeenCalledTimes(1)

    global.WebSocket = OriginalWebSocket
  })

  it('should send messages when connected', async () => {
    let capturedWs: MockWebSocket | null = null

    // Mock WebSocket constructor to capture instance
    const OriginalWebSocket = global.WebSocket
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url)
        capturedWs = this
      }
    } as any

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
      })
    )

    jest.runAllTimers()

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    const sendSpy = jest.spyOn(capturedWs as any, 'send')

    const message: WebSocketMessage = {
      type: 'user-action',
      payload: { action: 'update' },
    }

    act(() => {
      result.current.send(message)
    })

    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message))

    global.WebSocket = OriginalWebSocket
  })

  it('should handle disconnection', async () => {
    const onClose = jest.fn()

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        onClose,
        shouldReconnect: false,
      })
    )

    jest.runAllTimers()

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    act(() => {
      result.current.disconnect()
    })

    expect(result.current.isConnected).toBe(false)
  })

  it('should attempt to reconnect with exponential backoff', async () => {
    const initialDelay = 1000
    const maxDelay = 30000

    let connectAttempts = 0
    const OriginalWebSocket = global.WebSocket
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url)
        connectAttempts++
        // Fail first attempt
        if (connectAttempts === 1) {
          setTimeout(() => this.simulateError(), 50)
        }
      }
    } as any

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        shouldReconnect: true,
        maxReconnectAttempts: 3,
        initialReconnectDelay: initialDelay,
        maxReconnectDelay: maxDelay,
      })
    )

    jest.runAllTimers()

    await waitFor(() => {
      expect(connectAttempts).toBeGreaterThan(1)
    })

    global.WebSocket = OriginalWebSocket
  })

  it('should clear reconnection timeout on unmount', async () => {
    const { unmount } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        shouldReconnect: true,
      })
    )

    jest.runAllTimers()

    unmount()

    // Verify no pending timers
    expect(jest.getTimerCount()).toBe(0)
  })

  it('should handle WebSocket errors', async () => {
    const onError = jest.fn()

    let capturedWs: MockWebSocket | null = null
    const OriginalWebSocket = global.WebSocket
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url)
        capturedWs = this
        setTimeout(() => this.simulateError(), 100)
      }
    } as any

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        onError,
        shouldReconnect: false,
      })
    )

    jest.runAllTimers()

    await waitFor(() => {
      expect(result.current.error).not.toBe(null)
    })

    expect(onError).toHaveBeenCalled()

    global.WebSocket = OriginalWebSocket
  })

  it('should not exceed max reconnect attempts', async () => {
    const maxAttempts = 3
    let connectAttempts = 0

    const OriginalWebSocket = global.WebSocket
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url)
        connectAttempts++
        // Fail all attempts
        setTimeout(() => this.simulateError(), 50)
      }
    } as any

    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://localhost:8080',
        shouldReconnect: true,
        maxReconnectAttempts: maxAttempts,
        initialReconnectDelay: 100,
      })
    )

    jest.runAllTimers()

    // Should stop after maxAttempts
    await waitFor(() => {
      expect(connectAttempts).toBeLessThanOrEqual(maxAttempts + 1) // +1 for initial attempt
    })

    expect(result.current.isConnected).toBe(false)

    global.WebSocket = OriginalWebSocket
  })
})
