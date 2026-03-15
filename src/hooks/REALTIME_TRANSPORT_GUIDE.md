# Real-Time Transport Abstraction Layer

## Overview

The real-time transport abstraction layer decouples the notification UI from the polling implementation, enabling transparent upgrades to WebSocket or Server-Sent Events (SSE) without any UI component changes.

## Architecture

### Transport Interface

All transports implement a common interface:

```typescript
interface RealtimeTransport {
  subscribe(channel: string, callback: (data: unknown) => void): () => void
  getCapabilities(): TransportCapabilities
}
```

### Supported Transports

#### PollingTransport

HTTP-based polling mechanism that fetches fresh data on a recurring interval.

```typescript
import { PollingTransport } from '@/hooks'

const transport = new PollingTransport({
  interval: 30000,          // 30 seconds (default)
  pauseWhenHidden: true,    // Auto-pause when tab loses focus
})

const unsubscribe = transport.subscribe('notifications', (data) => {
  console.log('New data:', data)
})

// Cleanup
unsubscribe()
transport.destroy()
```

**Features:**
- Configurable polling interval
- Auto-pauses when document is hidden (saves bandwidth)
- Automatic cleanup on unsubscribe
- Graceful error handling with console debug output

#### WebSocketTransport (Stub)

Placeholder for future WebSocket implementation.

```typescript
import { WebSocketTransport } from '@/hooks'

// Will be identical API when implemented
const transport = new WebSocketTransport({
  url: 'wss://api.example.com/realtime'
})

// Same usage as PollingTransport
const unsubscribe = transport.subscribe('notifications', (data) => {
  console.log(data)
})
```

#### SSETransport (Stub)

Placeholder for future Server-Sent Events implementation.

```typescript
import { SSETransport } from '@/hooks'

// Will be identical API when implemented
const transport = new SSETransport({
  url: '/api/realtime/events'
})

// Same usage as PollingTransport
const unsubscribe = transport.subscribe('notifications', (data) => {
  console.log(data)
})
```

## Usage

### Basic Example

```typescript
import { useRealtimeSubscription } from '@/hooks'
import { useState } from 'react'

function NotificationCenter() {
  const [notifications, setNotifications] = useState([])

  useRealtimeSubscription({
    channel: 'notifications',
    onData: (data) => setNotifications(data),
    enabled: true,
  })

  return (
    <div>
      <h2>Notifications ({notifications.length})</h2>
      {notifications.map((n) => (
        <div key={n.id}>{n.message}</div>
      ))}
    </div>
  )
}
```

### With Custom Transport

```typescript
import { useRealtimeSubscription, WebSocketTransport } from '@/hooks'

const wsTransport = new WebSocketTransport({
  url: 'wss://api.example.com/realtime'
})

function MyComponent() {
  const [data, setData] = useState(null)

  useRealtimeSubscription({
    channel: 'tasks:123',
    onData: setData,
    transport: wsTransport, // Just swap the transport!
  })

  return <div>{data}</div>
}
```

## Transport Negotiation

The client can query server capabilities to select the best transport:

```typescript
async function getOptimalTransport() {
  const response = await fetch('/api/realtime/capabilities')
  const { supported, preferred } = await response.json()

  // Server declares: { supported: ['polling'], preferred: 'polling' }
  // When upgraded: { supported: ['polling', 'websocket'], preferred: 'websocket' }

  if (preferred === 'websocket' && supported.includes('websocket')) {
    return new WebSocketTransport()
  }
  return new PollingTransport()
}
```

## Endpoints

### GET /api/realtime/capabilities

Returns server's supported transport types and preferred option.

**Response:**
```json
{
  "supported": ["polling"],
  "preferred": "polling"
}
```

When upgraded to WebSocket/SSE:
```json
{
  "supported": ["polling", "websocket"],
  "preferred": "websocket"
}
```

### GET /api/realtime/:channel

Polling endpoint that returns latest data for a channel.

**Example:** `GET /api/realtime/notifications`

**Response:**
```json
{
  "channel": "notifications",
  "data": null,
  "timestamp": "2026-03-15T21:30:00Z"
}
```

## Migration Path

### Phase 1: Polling (Current)
- Use `useRealtimeSubscription` with default `PollingTransport`
- All UI components use the hook abstraction

### Phase 2: WebSocket Support
1. Implement `WebSocketTransport.subscribe()` and connection pooling
2. Update `/api/realtime/capabilities` handler to advertise WebSocket support
3. Update transport selection logic
4. **No UI component changes needed!**

### Phase 3: SSE Support
1. Implement `SSETransport.subscribe()` with EventSource API
2. Update capabilities endpoint
3. **No UI component changes needed!**

## Implementation Notes

### Why Stubs?

WebSocket and SSE are defined as stubs (not implemented) because:
- Only `PollingTransport` is currently active
- The architecture guarantees upgrade compatibility
- Ana's concern about premature optimization is valid
- Defines the contract for future implementations

### Error Handling

All transports gracefully handle errors:

```typescript
// PollingTransport silently logs polling errors
// UI should implement retry logic via TanStack Query
useRealtimeSubscription({
  channel: 'data',
  onData: (data) => {
    // Consumer is responsible for handling stale data scenarios
  }
})
```

### Performance Considerations

**PollingTransport:**
- Default 30s interval: low resource usage
- Pauses when tab is hidden: saves bandwidth
- Per-channel polling: fine-grained control
- Suitable for low-frequency updates

**Future WebSocket:**
- Single persistent connection: lower latency
- Bidirectional: enables server→client broadcasts
- Connection pooling: reuses connection for multiple channels

**Future SSE:**
- One-directional: simpler than WebSocket
- Built-in reconnection: EventSource API handles recovery
- Lighter than WebSocket for one-way updates

## Testing

```typescript
import { render, screen } from '@testing-library/react'
import { PollingTransport } from '@/hooks'

describe('useRealtimeSubscription', () => {
  it('subscribes to channel and receives data', async () => {
    const transport = new PollingTransport({ interval: 1000 })
    const callback = jest.fn()

    const unsubscribe = transport.subscribe('test', callback)

    // ... test assertions

    unsubscribe()
    transport.destroy()
  })
})
```

## Key Files

- `src/hooks/useRealtimeSubscription.ts` — Main hook
- `src/hooks/transports/types.ts` — Interface definitions
- `src/hooks/transports/PollingTransport.ts` — Polling implementation
- `src/hooks/transports/WebSocketTransport.ts` — WebSocket stub
- `src/hooks/transports/SSETransport.ts` — SSE stub
- `src/mocks/handlers/realtime.ts` — MSW mock handlers
