# Real-Time Event Stream Infrastructure

## Overview

The real-time event stream infrastructure provides a robust WebSocket/SSE integration layer that serves as the backbone for real-time features across the app. It handles connection lifecycle management, automatic reconnection with exponential backoff, smart query invalidation based on event types, and graceful fallback to polling if WebSocket is unavailable.

## Architecture

### Key Components

1. **`useRealtimeConnection` Hook** - Manages WebSocket connection lifecycle and event routing
2. **Type-Safe Event System** - Discriminated union types for all real-time events
3. **Smart Query Invalidation** - Automatic route-based cache invalidation
4. **Graceful Degradation** - Fallback to polling if WebSocket unavailable
5. **MSW WebSocket Mock** - Timer-based event simulation for development

### Connection States

The connection can be in one of four states:

- `connecting` - Establishing WebSocket connection
- `open` - WebSocket is connected and ready
- `closed` - Connection closed, not attempting reconnect
- `error` - Connection error occurred

## Usage

### Basic Setup

```typescript
import { useRealtimeConnection } from '@/hooks'

function MyComponent() {
  const { state, isConnected, error } = useRealtimeConnection({
    debug: true,
    onStateChange: (state) => console.log(`Connection: ${state}`),
  })

  return (
    <div>
      <p>Status: {state}</p>
      {error && <p className="error">{error.message}</p>}
    </div>
  )
}
```

### With Custom Event Routing

```typescript
import { useRealtimeConnection } from '@/hooks'
import { queryKeys } from '@/lib/queryKeys'

function AgentDashboard() {
  const { state, isConnected, isPollingFallback, reconnect } = useRealtimeConnection({
    wsUrl: 'wss://api.example.com/realtime',
    maxReconnectAttempts: 10,
    heartbeatInterval: 45000,

    // Custom routing for specific event types
    eventRoutes: {
      'agent:status-changed': queryKeys.agents.all,
      'agent:capacity-changed': queryKeys.agents.all,
      'task:updated': ['tasks'],
    },

    debug: process.env.NODE_ENV === 'development',
    onStateChange: (state) => {
      if (state === 'error') {
        // Show notification
      }
    },
    onError: (error) => {
      console.error('Connection error:', error)
    },
  })

  return (
    <div>
      <StatusBadge
        connected={isConnected}
        polling={isPollingFallback}
        onClick={reconnect}
      />
      {/* Component content */}
    </div>
  )
}
```

## Event Types

### Task Events

#### TaskCreatedEvent
Emitted when a new task is created.

```typescript
{
  type: 'task:created',
  taskId: 'task-123',
  sprintId: 'sprint-1',
  title: 'Implement auth',
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['tasks']`

#### TaskUpdatedEvent
Emitted when a task is modified.

```typescript
{
  type: 'task:updated',
  taskId: 'task-123',
  sprintId: 'sprint-1',
  changes: {
    status: 'in_progress',
    assignedAgentId: 'agent-5',
    priority: 'high'
  },
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['tasks']`

#### TaskDeletedEvent
Emitted when a task is deleted.

```typescript
{
  type: 'task:deleted',
  taskId: 'task-123',
  sprintId: 'sprint-1',
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['tasks']`

### Sprint Events

#### SprintStartedEvent
Emitted when a sprint transitions to active status.

```typescript
{
  type: 'sprint:started',
  sprintId: 'sprint-1',
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['sprints']`

#### SprintCompletedEvent
Emitted when a sprint is completed.

```typescript
{
  type: 'sprint:completed',
  sprintId: 'sprint-1',
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['sprints']`

#### SprintUpdatedEvent
Emitted when sprint details change.

```typescript
{
  type: 'sprint:updated',
  sprintId: 'sprint-1',
  changes: {
    status: 'active',
    name: 'Sprint 10'
  },
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['sprints']`

### Agent Events

#### AgentStatusChangedEvent
Emitted when an agent's status changes (online/offline/idle).

```typescript
{
  type: 'agent:status-changed',
  agentId: 'agent-5',
  status: 'active',
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['agents']`

#### AgentCapacityChangedEvent
Emitted when an agent's capacity or workload changes.

```typescript
{
  type: 'agent:capacity-changed',
  agentId: 'agent-5',
  capacity: 8,
  currentLoad: 5,
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['agents']`

### Notification Events

#### NotificationEvent
Emitted when a new notification is created.

```typescript
{
  type: 'notification:new',
  notificationId: 'notif-123',
  userId: 'user-1',
  message: 'Task assigned to you',
  timestamp: 1710000000000
}
```

**Query Invalidation:** `['notifications']`

## Configuration Options

### UseRealtimeConnectionOptions

```typescript
interface UseRealtimeConnectionOptions {
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
```

## Return Value

```typescript
interface UseRealtimeConnectionReturn {
  /** Current connection state: connecting, open, closed, error */
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
```

## Query Invalidation Flow

When a real-time event is received:

1. Event is parsed and validated (discriminated union type checking)
2. Event type is matched against the configured `eventRoutes`
3. Associated query keys are extracted
4. TanStack Query cache is invalidated for those keys
5. Components subscribed to those queries automatically refetch

### Default Event Routes

```typescript
{
  'task:updated': ['tasks'],
  'task:created': ['tasks'],
  'task:deleted': ['tasks'],
  'sprint:updated': ['sprints'],
  'sprint:started': ['sprints'],
  'sprint:completed': ['sprints'],
  'agent:status-changed': ['agents'],
  'agent:capacity-changed': ['agents'],
  'notification:new': ['notifications'],
}
```

### Custom Routes

You can override or extend routes:

```typescript
const { isConnected } = useRealtimeConnection({
  eventRoutes: {
    'task:updated': ['tasks', { details: true }],
    'agent:status-changed': ['agents', 'status', { view: 'dashboard' }],
  },
})
```

## Reconnection Strategy

### Exponential Backoff

When WebSocket connection is lost, the hook attempts to reconnect with exponential backoff:

1. First attempt: immediately
2. Second attempt: 1s delay
3. Third attempt: 2s delay
4. Fourth attempt: 4s delay
5. Fifth attempt: 8s delay
6. Subsequent attempts: capped at 30s

Each reconnection attempt resets the backoff timer. After max attempts, falls back to polling.

### Heartbeat

To keep the connection alive and detect stale connections:

- Client sends `{ type: 'heartbeat' }` every 30s (configurable)
- Server responds with `{ type: 'heartbeat:ack' }`
- If heartbeat fails, the next event cycle will trigger reconnection

## Graceful Degradation

If WebSocket is unavailable or all reconnection attempts fail:

1. `isPollingFallback` becomes `true`
2. Hook switches to HTTP polling at configurable interval (default: 30s)
3. Query invalidation continues to work normally
4. User can call `reconnect()` to retry WebSocket connection
5. If reconnect succeeds, polling is stopped automatically

## Development with MSW

The MSW WebSocket mock simulates realistic behavior:

```typescript
// In your test or Storybook setup
import { setupServer } from 'msw/node'
import { websocketHandlers } from '@/mocks/handlers/websocket'

const server = setupServer(...websocketHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Mock Event Generation

The mock generates random events every 5 seconds:

- **Task events:** Created, updated, deleted with random status/priority
- **Sprint events:** Started, completed, updated with status changes
- **Agent events:** Status changes (active/idle/offline), capacity changes

This simulates realistic network traffic patterns for UI testing.

### Extending Mock Events

To emit specific events for testing:

```typescript
// In MSW request handler or test
const mockEvent = {
  type: 'task:updated',
  taskId: 'task-123',
  sprintId: 'sprint-1',
  changes: { status: 'done' },
  timestamp: Date.now(),
}

// Handler can emit this through the WebSocket connection
client.send(JSON.stringify(mockEvent))
```

## Integration with TanStack Query

The connection works seamlessly with TanStack Query:

```typescript
function TaskList() {
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  // WebSocket events automatically invalidate and refetch ['tasks']
  const { state } = useRealtimeConnection()

  return (
    <div>
      <ConnectionStatus state={state} />
      <TaskTable tasks={tasks} />
    </div>
  )
}
```

## Error Handling

### Connection Errors

```typescript
const { state, error, reconnect } = useRealtimeConnection({
  onError: (error) => {
    if (error.message.includes('Certificate')) {
      // SSL/TLS error - likely environment issue
      logErrorToSentry(error)
    }
  },
})

if (state === 'error') {
  return (
    <ErrorBoundary>
      <p>Connection failed: {error?.message}</p>
      <button onClick={reconnect}>Retry</button>
    </ErrorBoundary>
  )
}
```

### Event Parsing Errors

Invalid events are logged but don't crash the hook:

```typescript
// Hook logs: "[RealtimeConnection] Failed to parse message: SyntaxError: ..."
// Connection continues working for subsequent events
```

## Performance Considerations

- **Memory:** Events are immediately routed and don't accumulate
- **CPU:** Heartbeat is every 30s (configurable); event processing is debounced by TanStack Query
- **Network:** Single persistent WebSocket connection for all events
- **Fallback:** Polling respects `prefersReducedMotion` (future enhancement)

## Testing

### Unit Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useRealtimeConnection } from '@/hooks'

describe('useRealtimeConnection', () => {
  it('connects and receives events', async () => {
    const { result } = renderHook(() => useRealtimeConnection())

    await waitFor(() => {
      expect(result.current.state).toBe('open')
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('falls back to polling on connection failure', async () => {
    const { result } = renderHook(() =>
      useRealtimeConnection({ maxReconnectAttempts: 1 })
    )

    // Simulate connection failure
    // After max attempts, should fallback to polling
    await waitFor(() => {
      expect(result.current.isPollingFallback).toBe(true)
    })
  })

  it('reconnects on request', async () => {
    const { result } = renderHook(() => useRealtimeConnection())

    // Initial state
    expect(result.current.state).toBe('open')

    // Trigger reconnection
    act(() => {
      result.current.reconnect()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('connecting')
    })
  })
})
```

## Troubleshooting

### Connection Won't Establish

1. Check WebSocket URL is correct (wss:// for HTTPS sites)
2. Verify server supports WebSocket at the endpoint
3. Check browser console for specific error messages
4. Try enabling `debug: true` for verbose logging

### Events Not Triggering Refetch

1. Verify event type matches your custom `eventRoutes`
2. Check that TanStack Query keys match exactly
3. Ensure query is enabled in `useQuery` configuration
4. Check that event timestamp is current (not stale)

### High Memory Usage

1. Reduce polling interval if using fallback
2. Review custom event routes for unnecessary invalidations
3. Check for leaking event listeners (ensure `disconnect()` is called)

## Future Enhancements

- [ ] Support for selective subscriptions (subscribe to specific entity IDs)
- [ ] Event filtering at WebSocket layer
- [ ] Compression support for large events
- [ ] Authentication/authorization for WebSocket connections
- [ ] Request-response patterns for bidirectional communication
- [ ] Priority-based event queuing

## Key Files

- `src/hooks/useRealtimeConnection.ts` - Main hook implementation
- `src/types/realtime.ts` - Type definitions and event schemas
- `src/mocks/handlers/websocket.ts` - MSW WebSocket mock setup
- `src/docs/realtime-infrastructure-guide.md` - This guide

## Related Issues

- **FAB-190:** Real-Time Event Stream Infrastructure (this feature)
- **FAB-192:** Notification Real-Time Integration (downstream)
