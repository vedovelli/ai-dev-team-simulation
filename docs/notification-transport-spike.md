# WebSocket Adapter Pattern Spike — Design Decision Documentation

## Overview

This document describes the `NotificationTransport` interface abstraction that decouples notification delivery mechanism from consumers. The spike implements the interface contract and a working `PollingTransport`, with `WebSocketTransport` as a documented stub for future implementation.

## Why This Design?

Currently, notifications poll every 30 seconds via `useNotifications` hook. As the product scales, real-time delivery via WebSocket becomes necessary to reduce latency and server load.

**Design Goal**: Allow swapping transport implementations without modifying consumer code or the public API.

### Problem with Direct Integration

Without abstraction, WebSocket upgrade would require:
- Modifying `NotificationCenterProvider`
- Updating all components using `useNotifications`
- Changing how subscriptions are managed
- Potentially breaking changes to the public API

### Solution: Transport Abstraction

By defining `NotificationTransport` interface now with polling as default, future WebSocket upgrade is a **drop-in replacement** requiring zero consumer changes.

## Architecture

### NotificationTransport Interface

Core contract that all transports must implement:

```typescript
export interface NotificationTransport {
  // Subscribe to notification events
  subscribe(callback: (event: NotificationEvent) => void): () => void

  // Get current connection status
  getStatus(): TransportStatus // 'connecting' | 'connected' | 'disconnected'

  // Attempt reconnection (idempotent)
  reconnect(): void

  // Clean up resources
  disconnect?(): void
}
```

### Transport Status

Three states representing transport health:

- **`connecting`**: Active attempt to establish connection (initial state, reconnecting)
- **`connected`**: Connected and receiving events
- **`disconnected`**: Not connected (error state, not polling, or explicitly disconnected)

### NotificationEvent

Events emitted by transports, extending base `Notification`:

```typescript
export interface NotificationEvent extends Notification {
  emittedAt: string  // When event was emitted
  sequence?: number  // Optional ordering sequence number
}
```

## Implementations

### PollingTransport (Current — Default)

Wraps the existing 30s polling mechanism into the `NotificationTransport` interface.

**Key Features**:
- Interval-based polling (default 30s, configurable)
- Lazy start: begins polling on first subscription
- Smart emission: only emits when notifications are new or changed
- Automatic cleanup: stops polling when last subscriber unsubscribes
- Exponential backoff simulation: available for future networking improvements

**Usage**:

```typescript
import { PollingTransport } from '@/transport/PollingTransport'

const transport = new PollingTransport({
  interval: 30000, // 30 seconds
  fetchNotifications: async () => {
    const response = await fetch('/api/notifications')
    return response.json()
  },
  onError: (error) => console.error('Polling failed:', error),
})

// Subscribe to events
const unsubscribe = transport.subscribe((event) => {
  console.log('New notification:', event)
})

// Check status
console.log(transport.getStatus()) // 'connected' or 'disconnected'

// Manual reconnect after network issue
transport.reconnect()

// Cleanup
unsubscribe()
transport.disconnect()
```

### WebSocketTransport (Future — Stub)

Documented stub defining the implementation strategy for real-time delivery via WebSocket.

The stub includes comprehensive TODO comments and implementation guidance in `src/transport/WebSocketTransport.stub.ts`. See that file for:
- Connection management strategy
- Message protocol design
- Event emission patterns
- Error handling and reconnection with backoff
- Testing approaches

## Configuration

The `TransportConfig` type allows injecting custom transports:

```typescript
export interface TransportConfig {
  // Custom transport implementation (defaults to PollingTransport)
  transport?: NotificationTransport

  // Polling interval, only used by PollingTransport
  pollingInterval?: number
}
```

Usage with `NotificationCenterProvider`:

```typescript
// Current: uses PollingTransport by default
<NotificationCenterProvider>
  <App />
</NotificationCenterProvider>

// Custom transport injection (ready for WebSocket upgrade)
<NotificationCenterProvider config={{ transport: customTransport }}>
  <App />
</NotificationCenterProvider>
```

## Migration Path

### Today (Polling Only)

```typescript
// useNotifications hook uses PollingTransport internally
const { notifications, unreadCount } = useNotifications()
```

### Tomorrow (WebSocket Available)

```typescript
// Drop-in replacement — no consumer code changes
const transport = new WebSocketTransport({
  url: 'wss://api.example.com/ws/notifications',
  heartbeatInterval: 30000,
})

<NotificationCenterProvider config={{ transport }}>
  <App />
</NotificationCenterProvider>

// Components unchanged
const { notifications, unreadCount } = useNotifications()
```

### Gradual Rollout Strategy

1. **Phase 1**: Implement WebSocketTransport (complete TODO comments in stub)
2. **Phase 2**: Add feature flag for WebSocket transport selection
3. **Phase 3**: A/B test: 10% → 25% → 50% → 100% rollout
4. **Phase 4**: Deprecate polling (remove PollingTransport after 2-3 releases)

## Design Decisions

### Why subscriber-based rather than broadcast?

The `subscribe()` method returns an unsubscribe function rather than a broadcast pattern to:
- Support multiple independent consumers with different preferences
- Enable lazy initialization (start transport when first subscriber joins)
- Simplify cleanup (stop when last subscriber leaves)
- Support React hooks pattern (useEffect cleanup)

### Why separate `NotificationEvent` from `Notification`?

`NotificationEvent` extends `Notification` with transport-specific metadata:
- `emittedAt`: When event was sent (server timestamp for WebSocket, local for polling)
- `sequence`: Optional ordering for detecting missed events

This keeps transport concerns separate from core notification data.

### Why status instead of boolean connected?

`TransportStatus` enum (`connecting | connected | disconnected`) vs boolean `isConnected`:
- More explicit state representation
- Distinguishes between "trying to connect" (connecting) and "failed" (disconnected)
- Enables UI feedback during connection attempts
- Future extensibility

## Testing Considerations

### Unit Testing PollingTransport

```typescript
it('should emit notifications on fetch', async () => {
  const mockFetch = jest.fn().mockResolvedValue([notification1])
  const transport = new PollingTransport({ fetchNotifications: mockFetch })

  const events: NotificationEvent[] = []
  transport.subscribe((event) => events.push(event))

  // Advance timers
  jest.advanceTimersByTime(30000)

  expect(events).toHaveLength(1)
})
```

### Integration Testing WebSocketTransport (Future)

Use Mock Service Worker (MSW) with WebSocket adapter:

```typescript
import { ws } from 'msw'

const handlers = [
  ws.link('wss://api.example.com/ws/notifications', ({ client }) => {
    client.send(JSON.stringify({ type: 'notification', data: event }))
  }),
]
```

## Files

- `src/types/notification-transport.ts` — Interface definitions
- `src/transport/PollingTransport.ts` — Current implementation
- `src/transport/WebSocketTransport.stub.ts` — Future implementation stub with strategy
- `docs/notification-transport-spike.md` — This document

## Future Considerations

### Performance Metrics

Track these metrics to validate WebSocket upgrade:
- Notification latency (p50, p95, p99)
- Server CPU/memory per active connection
- Client battery usage (mobile)
- Network bandwidth consumption

### Fallback Strategy

If WebSocket fails (network issues, browser limitations):
- Automatic fallback to polling
- Hybrid mode: poll every 5min + subscribe to WebSocket
- Clear user feedback: "Notifications may be delayed"

### Enhanced Features

Once WebSocket is stable:
- Subscription filtering: only subscribe to specific notification types
- Presence indicators: show which users are active
- Typing indicators: real-time UI state sync
- Broadcast reactions: instant group updates

## References

- TanStack Query documentation: https://tanstack.com/query/latest
- WebSocket MDN: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Server-Sent Events (SSE): https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Design Patterns: Observer, Adapter, Strategy
