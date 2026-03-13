# useRealtimeSync Hook — Cache Abstraction Layer

## Overview

`useRealtimeSync` is a transport-agnostic, cache-aware hook that synchronizes entity updates in real-time. It abstracts polling and future WebSocket transports behind a unified interface, automatically invalidating related TanStack Query cache keys when data changes.

**Architecture**: Built for FAB-185, this hook implements a clean separation between data transport (polling vs WebSocket) and cache management, enabling future transport swaps without touching component code.

## Features

- **Transport-Agnostic**: Same interface for polling (now) and WebSocket (future)
- **Automatic Cache Invalidation**: Intelligently invalidates related query keys on updates
- **Entity Subscriptions**: Subscribe to specific entity types (task, sprint, agent) with optional ID filtering
- **Batch Update Handling**: Accumulates high-frequency updates for efficient processing
- **Exponential Backoff**: Automatic retry with exponential backoff on poll failures
- **TypeScript Generics**: Fully typed event payloads and update structures
- **MSW Compatible**: Works seamlessly in test environments with mocked data

## Types

### EntitySubscription

Define what entities to monitor:

```typescript
interface EntitySubscription {
  entity: 'task' | 'sprint' | 'agent'
  id?: string  // Optional: monitor specific entity or all
}
```

**Examples:**
```typescript
// Subscribe to all task updates
{ entity: 'task' }

// Subscribe to updates for specific task
{ entity: 'task', id: 'task-123' }

// Subscribe to all sprints
{ entity: 'sprint' }

// Multiple subscriptions
[
  { entity: 'task', id: 'task-123' },
  { entity: 'sprint', id: 'sprint-1' },
  { entity: 'agent' },
]
```

### RealtimeUpdateEvent

When an update arrives:

```typescript
interface RealtimeUpdateEvent<T = unknown> {
  subscription: EntitySubscription  // The subscription that triggered
  payload: T                         // The entity update data
  timestamp: number                  // Server timestamp (ms)
}
```

### UpdateCallback

Function signature for handling updates:

```typescript
type UpdateCallback<T = unknown> = (event: RealtimeUpdateEvent<T>) => void
```

### UseRealtimeSyncOptions

Hook configuration:

```typescript
interface UseRealtimeSyncOptions {
  subscriptions: EntitySubscription[]
  onUpdate: UpdateCallback
  pollingConfig?: PollingTransportConfig
  batchConfig?: BatchUpdateConfig
  debug?: boolean
}
```

### PollingTransportConfig

Control polling behavior:

```typescript
interface PollingTransportConfig {
  pollInterval?: number              // Default: 30000 (30 seconds)
  enableExponentialBackoff?: boolean // Default: true
  maxRetries?: number                // Default: 3
}
```

### BatchUpdateConfig

Optimize high-frequency updates:

```typescript
interface BatchUpdateConfig {
  enabled: boolean                   // Enable batching (default: false)
  timeout?: number                   // Flush after this ms (default: 500)
  maxSize?: number                   // Flush when this many updates (default: 10)
}
```

### UseRealtimeSyncReturn

Hook return value:

```typescript
interface UseRealtimeSyncReturn {
  isConnected: boolean               // Transport is active
  error: Error | null                // Last error, if any
  refetch: () => Promise<void>       // Trigger immediate refetch
  updateSubscriptions: (subs) => void // Change subscriptions dynamically
  disconnect: () => void             // Stop syncing
}
```

## Usage Examples

### Basic Setup

Monitor a task and invalidate its cache on updates:

```typescript
import { useRealtimeSync } from '@/hooks'

function TaskDetailPanel({ taskId }: { taskId: string }) {
  const { isConnected, error } = useRealtimeSync({
    subscriptions: [{ entity: 'task', id: taskId }],
    onUpdate: (event) => {
      console.log('Task updated:', event.payload)
      // Cache invalidation happens automatically
    },
  })

  return (
    <div>
      {isConnected ? '✓ Synced' : '○ Offline'}
      {error && <div className="error">Sync error: {error.message}</div>}
    </div>
  )
}
```

### Multiple Subscriptions

Monitor multiple entities:

```typescript
const { isConnected, refetch } = useRealtimeSync({
  subscriptions: [
    { entity: 'task', id: taskId },
    { entity: 'sprint', id: sprintId },
    { entity: 'agent' },  // All agents
  ],
  onUpdate: (event) => {
    // React to updates
    if (event.subscription.entity === 'task') {
      console.log('Task changed:', event.payload)
    }
  },
})
```

### Custom Polling Interval

Adjust polling frequency:

```typescript
const { isConnected } = useRealtimeSync({
  subscriptions: [{ entity: 'task' }],
  onUpdate: handleUpdate,
  pollingConfig: {
    pollInterval: 60 * 1000,  // Poll every 60 seconds
    enableExponentialBackoff: true,
    maxRetries: 5,
  },
})
```

### Batch Updates for High-Frequency Scenarios

Accumulate updates before processing:

```typescript
const { isConnected } = useRealtimeSync({
  subscriptions: [{ entity: 'task' }],
  onUpdate: (event) => {
    // This callback batches updates
    console.log('Batch of updates:', event)
  },
  batchConfig: {
    enabled: true,
    timeout: 1000,  // Flush after 1 second
    maxSize: 20,    // Or when 20 updates accumulated
  },
})
```

### Dynamic Subscription Updates

Change subscriptions at runtime:

```typescript
function ComponentWithDynamicSubs({ selectedTaskId }: { selectedTaskId: string }) {
  const { isConnected, updateSubscriptions } = useRealtimeSync({
    subscriptions: [{ entity: 'task', id: selectedTaskId }],
    onUpdate: handleUpdate,
  })

  // When selected task changes, update subscription
  useEffect(() => {
    updateSubscriptions([{ entity: 'task', id: selectedTaskId }])
  }, [selectedTaskId, updateSubscriptions])

  return <div>{isConnected && '✓ Synced'}</div>
}
```

### Manual Refetch

Trigger immediate data refresh:

```typescript
function TaskDashboard({ taskId }: { taskId: string }) {
  const { refetch } = useRealtimeSync({
    subscriptions: [{ entity: 'task', id: taskId }],
    onUpdate: () => {},
  })

  return (
    <button onClick={() => refetch()}>
      Refresh Data
    </button>
  )
}
```

### Debug Logging

Enable debug logs to monitor sync activity:

```typescript
const { isConnected } = useRealtimeSync({
  subscriptions: [{ entity: 'task' }],
  onUpdate: handleUpdate,
  debug: true,  // Logs to console
})
```

## Cache Invalidation Strategy

The hook automatically invalidates related query keys when updates arrive:

### Task Updates
```typescript
// Specific task
['tasks', taskId]
['tasks', taskId, 'details']

// All tasks
['tasks']
['tasks', 'list']
```

### Sprint Updates
```typescript
// Specific sprint
['sprints', sprintId]
['sprints', sprintId, 'metrics']
['sprints', sprintId, 'tasks']

// All sprints
['sprints']
['sprints', 'list']
```

### Agent Updates
```typescript
// Specific agent
['agents', agentId]
['agents', agentId, 'status']
['agents', agentId, 'tasks']

// All agents
['agents']
['agents', 'list']
```

This ensures that when an entity changes, all dependent queries automatically refetch fresh data.

## Transport Interface (Future WebSocket)

The hook's transport abstraction is designed for easy swapping:

```typescript
interface RealtimeTransport {
  subscribe(subscriptions: EntitySubscription[], callback: UpdateCallback): void
  unsubscribe(): void
  isConnected(): boolean
  cleanup(): void
}
```

**Current Implementation**: `PollingTransport` — polls `/api/realtime/sync?entity=<type>`

**Future**: `WebSocketTransport` will implement the same interface, requiring zero component changes.

### Adding WebSocket Support

When ready, a `WebSocketTransport` class would:

```typescript
class WebSocketTransport implements RealtimeTransport {
  private ws: WebSocket
  private subscriptions: EntitySubscription[] = []
  private callback: UpdateCallback | null = null

  subscribe(subscriptions: EntitySubscription[], callback: UpdateCallback) {
    this.subscriptions = subscriptions
    this.callback = callback
    this.ws = new WebSocket('ws://api/realtime')
    this.ws.onmessage = (event) => {
      const update: RealtimeUpdateEvent = JSON.parse(event.data)
      callback(update)
    }
  }

  unsubscribe() {
    this.ws?.close()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  cleanup() {
    this.ws?.close()
  }
}
```

Then in the hook, swap transports:

```typescript
// Old: new PollingTransport(config)
// New: new WebSocketTransport(config)
```

## Error Handling

The hook captures and exposes transport errors:

```typescript
const { error, isConnected } = useRealtimeSync({
  subscriptions: [{ entity: 'task' }],
  onUpdate: handleUpdate,
})

// Error cases
if (error && error.message.includes('Failed to fetch')) {
  // Network error
}

if (!isConnected && error) {
  // Retrying with exponential backoff
}
```

The implementation includes:
- Exponential backoff on poll failures
- Configurable retry limits (default: 3 attempts)
- Error recovery to resume polling

## Data Flow

```
useRealtimeSync Hook
  ↓
PollingTransport.subscribe()
  ├─ Fetch /api/realtime/sync?entity=task
  ├─ Fetch /api/realtime/sync?entity=sprint
  └─ Fetch /api/realtime/sync?entity=agent
  ↓
Filter updates by subscriptions
  ↓
Batch or immediate callback
  ↓
onUpdate(event) user callback
  ↓
invalidateRelatedQueries()
  ├─ ['tasks', taskId]
  ├─ ['sprints', sprintId]
  └─ ['agents', agentId]
  ↓
TanStack Query refetches affected caches
  ↓
Components re-render with fresh data
```

## Testing

The hook works seamlessly with MSW mocks:

```typescript
// MSW handler for /api/realtime/sync
http.get('/api/realtime/sync', ({ request }) => {
  const entity = new URL(request.url).searchParams.get('entity')

  return HttpResponse.json([
    {
      subscription: { entity },
      payload: { id: 'task-1', title: 'Updated title' },
      timestamp: Date.now(),
    },
  ])
})
```

### In Tests

```typescript
test('syncs task updates', async () => {
  const { rerender } = render(
    <TaskPanel taskId="task-1" />
  )

  await waitFor(() => {
    expect(screen.getByText('Updated title')).toBeInTheDocument()
  })
})
```

## Performance Considerations

1. **Polling Interval**: Default 30s balances freshness and server load
2. **Batch Updates**: Enabled for high-frequency scenarios (10+ updates/second)
3. **Cache Granularity**: Invalidates at multiple levels (entity, list, related)
4. **Exponential Backoff**: Prevents server overload during outages
5. **Cleanup**: Unsubscribes and cancels polling on unmount

## Query Key Convention

All invalidation uses consistent key patterns:

```typescript
// Entity-level
['tasks', id]
['sprints', id]
['agents', id]

// List-level
['tasks']
['sprints']
['agents']

// Detail-level
['tasks', id, 'details']
['sprints', id, 'metrics']
['agents', id, 'status']
```

This enables:
- Selective invalidation via `useQuery({ queryKey: [...] })`
- React Query DevTools debugging
- Clear cache hierarchy

## Next Steps / Future Work

1. **WebSocket Transport**: Implement `WebSocketTransport` class (no hook changes needed)
2. **Event Types**: Extend `EntityUpdate` discriminated union for type safety
3. **Reconnection Logic**: Add exponential backoff for WebSocket reconnects
4. **Metrics**: Track sync events and cache invalidations
5. **Offline Support**: Queue updates while offline, sync when reconnected

## API Endpoint Contract

The polling transport expects:

**GET** `/api/realtime/sync?entity={task|sprint|agent}`

**Response:**
```json
[
  {
    "subscription": { "entity": "task", "id": "task-123" },
    "payload": { "id": "task-123", "title": "...", "status": "..." },
    "timestamp": 1710345600000
  }
]
```

## Migration Guide

### From Manual Cache Invalidation

Before:
```typescript
const { data: task } = useQuery({
  queryKey: ['tasks', taskId],
  queryFn: () => fetchTask(taskId),
})

// Manual invalidation on some action
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['tasks'] })
```

After:
```typescript
useRealtimeSync({
  subscriptions: [{ entity: 'task', id: taskId }],
  onUpdate: () => {
    // Automatic cache invalidation
  },
})

const { data: task } = useQuery({
  queryKey: ['tasks', taskId],
  queryFn: () => fetchTask(taskId),
})
```

## Success Criteria ✅

- ✅ Transport-agnostic interface (polling now, WebSocket later)
- ✅ Automatic cache invalidation for related query keys
- ✅ Entity subscription API with optional ID filtering
- ✅ Batch update handling for high-frequency scenarios
- ✅ Exponential backoff retry logic
- ✅ Full TypeScript generics with typed payloads
- ✅ MSW compatible
- ✅ ~350 lines of implementation (hook + transport)
- ✅ Comprehensive documentation
