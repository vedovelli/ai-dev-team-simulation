# WebSocket Infrastructure Guide

This guide covers the WebSocket infrastructure for real-time collaboration features, including auto-reconnection, TanStack Query integration, and testing patterns.

## Table of Contents

1. [Overview](#overview)
2. [Core Hook: useWebSocket](#core-hook-usewebsocket)
3. [TanStack Query Integration](#tanstack-query-integration)
4. [Testing](#testing)
5. [Patterns & Examples](#patterns--examples)
6. [Troubleshooting](#troubleshooting)

## Overview

The WebSocket infrastructure provides:

- **useWebSocket**: Custom hook managing persistent WebSocket connections
- **Auto-reconnect**: Exponential backoff on disconnection
- **TanStack Query Integration**: Seamless cache updates from realtime events
- **Testing Infrastructure**: Mock WebSocket and test utilities
- **Error Handling**: Graceful error boundaries and cleanup

### When to Use

- Live agent status updates
- Real-time task assignments
- Collaborative editing
- Activity feeds
- Notification systems

## Core Hook: useWebSocket

### Basic Usage

```typescript
import { useWebSocket } from '@/hooks'

function MyComponent() {
  const { isConnected, send, disconnect } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: (message) => {
      console.log('Received:', message)
    },
  })

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
      <button onClick={() => send({ type: 'ping', payload: {} })}>
        Send Ping
      </button>
    </div>
  )
}
```

### API Reference

#### Options

```typescript
interface UseWebSocketOptions<T = any> {
  url: string                              // WebSocket URL (required)
  onMessage?: (msg: WebSocketMessage<T>) => void  // Message handler
  onError?: (error: Event) => void         // Error handler
  onOpen?: () => void                      // Connection open handler
  onClose?: () => void                     // Connection close handler
  shouldReconnect?: boolean                // Auto-reconnect (default: true)
  maxReconnectAttempts?: number            // Max reconnect tries (default: 5)
  initialReconnectDelay?: number           // Initial delay in ms (default: 1000)
  maxReconnectDelay?: number               // Max delay in ms (default: 30000)
  onQueryData?: (queryKey, data) => void   // Query update callback
}
```

#### Return Value

```typescript
interface UseWebSocketReturn {
  isConnected: boolean                     // Current connection state
  isConnecting: boolean                    // Connecting in progress
  error: Error | null                      // Last error, if any
  send: (message: WebSocketMessage) => void  // Send a message
  disconnect: () => void                   // Close connection
}
```

### Auto-Reconnection with Exponential Backoff

The hook automatically reconnects with exponential backoff when the connection drops:

```typescript
const { isConnected } = useWebSocket({
  url: 'ws://localhost:8080',
  shouldReconnect: true,
  initialReconnectDelay: 1000,      // Start at 1 second
  maxReconnectDelay: 30000,         // Cap at 30 seconds
  maxReconnectAttempts: 5,          // Give up after 5 attempts
})

// Backoff sequence: 1s → 2s → 4s → 8s → 16s
```

**Backoff calculation:**
```
delay[n] = min(initialDelay * 2^n, maxReconnectDelay)
```

### Error Handling

```typescript
const { error, isConnected } = useWebSocket({
  url: 'ws://localhost:8080',
  onError: (event) => {
    console.error('WebSocket error occurred')
    // Handle error - log, show notification, etc.
  },
  onClose: () => {
    console.log('Connection closed, will attempt to reconnect...')
  },
})

if (error) {
  return <ErrorBoundary error={error} />
}
```

### Message Format

Messages follow a simple type/payload pattern:

```typescript
interface WebSocketMessage<T = any> {
  type: string           // Message type (e.g., 'agent-status-update')
  payload: T            // Message data
}

// Sending
send({
  type: 'subscribe',
  payload: { channel: 'agent-status' }
})

// Receiving
onMessage: (message) => {
  if (message.type === 'agent-status-update') {
    // Handle update
  }
}
```

## TanStack Query Integration

The `useWebSocketQueryIntegration` helper makes it easy to sync WebSocket updates with TanStack Query cache.

### Basic Integration

```typescript
import { useWebSocket, useWebSocketQueryIntegration } from '@/hooks'

function AgentMonitor() {
  // Setup query integration
  const { updateQueryData, invalidateQuery } = useWebSocketQueryIntegration({
    queryKey: ['agents'],
    onMergeData: (existing, incoming) => {
      // Custom merge strategy
      return {
        ...existing,
        agents: existing.agents.map(a =>
          a.id === incoming.id ? incoming : a
        ),
      }
    },
  })

  // Connect WebSocket
  const { isConnected } = useWebSocket({
    url: 'ws://localhost:8080',
    onMessage: (message) => {
      if (message.type === 'agent-update') {
        updateQueryData(message.payload)
      }
    },
  })

  return <AgentList />
}
```

### Update Strategies

#### 1. Smart Merge (Default)

Update specific fields while preserving the rest:

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['agents'],
  onMergeData: (existing, incoming) => {
    // Only update changed fields
    return { ...existing, ...incoming }
  },
})
```

#### 2. Array Item Update

Update a specific item in an array:

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['agents'],
  onMergeData: (existing: Agent[], incoming: AgentStatusUpdate) => {
    return existing.map(agent =>
      agent.id === incoming.agentId
        ? { ...agent, status: incoming.status }
        : agent
    )
  },
})
```

#### 3. Append to List

Add new items to a list:

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['activities'],
  onMergeData: (existing: Activity[], incoming: Activity) => {
    return [incoming, ...existing]
  },
})
```

#### 4. Replace on Refetch

For complex updates, invalidate and refetch:

```typescript
const { invalidateQuery } = useWebSocketQueryIntegration({
  queryKey: ['agents'],
  onInvalidate: true,  // Force refetch instead of update
})
```

### API Reference

```typescript
interface WebSocketQueryIntegrationOptions {
  queryKey: string[]                          // Query key to update
  onMergeData?: (existing, incoming) => any   // Custom merge function
  onInvalidate?: boolean                      // Invalidate instead of update
  onRefetch?: boolean                         // Refetch instead of update
}

// Returns
{
  updateQueryData: (data) => void             // Update cache with merge
  invalidateQuery: () => void                 // Invalidate and refetch
  refetchQuery: () => void                    // Immediate refetch
  getQueryData: () => any                     // Read current cache value
  clearQueryData: () => void                  // Clear cache entry
  handleWebSocketMessage: (msg) => void       // Auto-handle with config
}
```

## Testing

### Setup WebSocket Mock

```typescript
import { setupWebSocketMock, cleanupWebSocketMock } from '@/mocks/webSocketHandlers'
import { renderHook, act, waitFor } from '@testing-library/react'

describe('WebSocket Hook', () => {
  beforeEach(() => {
    setupWebSocketMock()
  })

  afterEach(() => {
    cleanupWebSocketMock()
  })

  it('should connect successfully', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080' })
    )

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })
})
```

### Test Scenarios

#### Connection Lifecycle

```typescript
it('handles connection and disconnection', async () => {
  const onOpen = jest.fn()
  const onClose = jest.fn()

  const { result } = renderHook(() =>
    useWebSocket({
      url: 'ws://localhost:8080',
      onOpen,
      onClose,
    })
  )

  await waitFor(() => expect(onOpen).toHaveBeenCalled())

  act(() => {
    result.current.disconnect()
  })

  expect(result.current.isConnected).toBe(false)
  expect(onClose).toHaveBeenCalled()
})
```

#### Message Handling

```typescript
it('handles incoming messages', async () => {
  const onMessage = jest.fn()

  renderHook(() =>
    useWebSocket({
      url: 'ws://localhost:8080',
      onMessage,
    })
  )

  // Simulate incoming message
  const message = { type: 'test', payload: { data: 'test' } }
  // Message would be received from server in real scenario
})
```

#### Reconnection Logic

```typescript
it('reconnects with exponential backoff', async () => {
  const { result } = renderHook(() =>
    useWebSocket({
      url: 'ws://localhost:8080',
      shouldReconnect: true,
      initialReconnectDelay: 100,
    })
  )

  // Simulate connection failure
  act(() => {
    // Trigger failure scenario
  })

  await waitFor(() => {
    expect(result.current.isConnecting).toBe(true)
  })
})
```

### Helper Utilities

```typescript
import {
  MockWebSocket,
  getExponentialBackoffDelays,
  createReconnectionScenario,
  WebSocketTestScenarios,
} from '@/mocks/webSocketHandlers'

// Get backoff delay sequence
const delays = getExponentialBackoffDelays({
  initialDelay: 1000,
  maxDelay: 30000,
  attempts: 5,
})
// [1000, 2000, 4000, 8000, 16000]

// Create reconnection test scenario
const scenario = createReconnectionScenario({
  failAttempts: 2,
  delayBetweenAttempts: 100,
})

// Use predefined test scenarios
const { setup } = WebSocketTestScenarios.connectionFailureWithReconnect
```

## Patterns & Examples

### Pattern 1: Simple Status Updates

Update a single status field:

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['agent', agentId],
  onMergeData: (existing, incoming: { status: string }) => ({
    ...existing,
    status: incoming.status,
    lastUpdated: new Date().toISOString(),
  }),
})

useWebSocket({
  url: wsUrl,
  onMessage: (msg) => {
    if (msg.type === 'agent-status-update') {
      updateQueryData(msg.payload)
    }
  },
})
```

### Pattern 2: List with Updates

Update items in a paginated list safely:

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['agents', { limit: 10, offset: 0 }],
  onMergeData: (existing: { items: Agent[] }, incoming: Agent) => ({
    ...existing,
    items: existing.items.map(item =>
      item.id === incoming.id ? incoming : item
    ),
  }),
})
```

### Pattern 3: Complex Data Sync

For complex updates, use refetch:

```typescript
const { invalidateQuery } = useWebSocketQueryIntegration({
  queryKey: ['dashboard', { userId }],
  onInvalidate: true,  // Refetch entire dashboard
})

useWebSocket({
  url: wsUrl,
  onMessage: (msg) => {
    if (msg.type === 'dashboard-update') {
      invalidateQuery()  // Refetch to get fresh data
    }
  },
})
```

### Pattern 4: Real-time Activity Feed

Prepend new activities to a list:

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['activities'],
  onMergeData: (existing: Activity[], incoming: Activity) => {
    // Add to front, limit to prevent unbounded growth
    const updated = [incoming, ...existing]
    return updated.slice(0, 100)  // Keep last 100
  },
})
```

## Troubleshooting

### Connection Won't Establish

**Symptom**: `isConnecting` stays true, never connects

**Solutions**:
1. Check WebSocket URL is correct (ws:// not http://)
2. Verify server is running and listening
3. Check CORS/WebSocket policy if cross-origin
4. Look for browser console errors

```typescript
const { error } = useWebSocket({
  url: wsUrl,
  onError: (event) => console.error(event),
})
```

### Messages Not Arriving

**Symptom**: `onMessage` callback never fires

**Solutions**:
1. Verify message format matches expected type
2. Check message JSON parsing in handler
3. Ensure hook is still mounted when message arrives
4. Verify server is sending messages

```typescript
onMessage: (msg) => {
  console.log('Received:', msg.type, msg.payload)
}
```

### Reconnection Loop

**Symptom**: Hook continuously reconnects

**Solutions**:
1. Reduce `maxReconnectAttempts` to stop sooner
2. Increase `maxReconnectDelay` to wait longer
3. Add circuit breaker for persistent failures
4. Check server logs for why connection fails

```typescript
const { isConnecting, error } = useWebSocket({
  shouldReconnect: true,
  maxReconnectAttempts: 3,
  maxReconnectDelay: 30000,
})

if (isConnecting && error) {
  console.error('Reconnection failed:', error)
}
```

### Memory Leaks

**Symptom**: Event listeners not cleaned up

**Solutions**:
1. Always cleanup on unmount (hook does this automatically)
2. Remove event listeners properly
3. Clear reconnection timeouts

```typescript
useEffect(() => {
  const { disconnect } = useWebSocket({ url: wsUrl })

  return () => {
    disconnect()  // Cleanup on unmount
  }
}, [])
```

### Cache Out of Sync

**Symptom**: Stale data in cache after WebSocket update

**Solutions**:
1. Use correct merge strategy
2. Verify payload matches expected shape
3. Check query key matches exactly
4. Use `invalidateQuery` for complex updates

```typescript
const { updateQueryData } = useWebSocketQueryIntegration({
  queryKey: ['agents'],  // Must match exactly
  onMergeData: (existing, incoming) => {
    console.log('Merging:', existing, incoming)
    return { ...existing, ...incoming }
  },
})
```

## Security Considerations

1. **Validate Messages**: Always validate incoming WebSocket messages
2. **Authenticated URLs**: Use secure WebSocket (wss://) in production
3. **CORS/CSP**: Configure WebSocket policies appropriately
4. **Error Boundaries**: Implement error boundaries for critical failures
5. **Rate Limiting**: Consider rate limiting on client for sent messages

```typescript
const validateMessage = (msg: WebSocketMessage): boolean => {
  if (!msg.type || !msg.payload) return false
  if (!allowedTypes.includes(msg.type)) return false
  return true
}

useWebSocket({
  url: wssUrl,  // Secure WebSocket
  onMessage: (msg) => {
    if (!validateMessage(msg)) {
      console.warn('Invalid message received')
      return
    }
    handleMessage(msg)
  },
})
```

## Performance Tips

1. **Batch Updates**: Collect multiple updates before cache write
2. **Debounce**: Debounce frequent updates (e.g., location)
3. **Selective Merge**: Only update changed fields
4. **Cleanup**: Remember to disconnect when done

```typescript
// Batch updates
const updates = new Map<string, any>()
const flushUpdates = () => {
  updates.forEach((payload, type) => {
    updateQueryData(payload)
  })
  updates.clear()
}

useWebSocket({
  onMessage: (msg) => {
    updates.set(msg.type, msg.payload)
    // Flush after 100ms of inactivity
  },
})
```

## See Also

- [TanStack Query Documentation](https://tanstack.com/query)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Testing Library](https://testing-library.com/)
