# Agent Status & Availability System

Comprehensive real-time agent status monitoring system with intelligent polling, caching, and state management.

## Overview

The Agent Status & Availability System provides a unified way to monitor agent real-time availability across the platform. It enables intelligent task assignment by tracking agent status, capacity, and capabilities.

## Architecture

### Status Model

Agents have four availability states:

- **`idle`** - Agent is available and waiting for work
- **`active`** - Agent is working on 1 task (handling normal load)
- **`busy`** - Agent is working on 2+ tasks (at higher capacity)
- **`offline`** - Agent is not available or disconnected

### Data Flow

```
useAgentStatus Hook
    ↓
TanStack Query Cache
    ↓
GET /api/agents/:id/status (MSW Handler)
    ↓
AgentAvailability Response
    ↓
AgentStatusPanel Component
```

## Implementation Guide

### 1. useAgentStatus Hook

The custom hook manages all data fetching, caching, and polling logic.

**Features:**
- 10-second polling interval (configurable)
- Automatic refetch on window focus
- Stale-while-revalidate strategy (10s stale, 5min gc)
- Exponential backoff retry (3 attempts)
- Connection recovery support

**Usage:**

```typescript
import { useAgentStatus } from '@/hooks/useAgentStatus'

function MyComponent() {
  const {
    data,        // AgentAvailability | undefined
    isLoading,   // boolean
    error,       // Error | null
    isFetching,  // boolean (true during background updates)
  } = useAgentStatus('agent-sr-dev', {
    refetchInterval: 15 * 1000,  // Optional: customize polling
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <h2>{data.name}</h2>
      <p>Status: {data.status}</p>
    </div>
  )
}
```

**Query Key Structure:**

```typescript
['agents', agentId, 'status']
```

This key structure ensures:
- Proper cache invalidation per agent
- Automatic cleanup when component unmounts
- Efficient queries for multiple agents

### 2. AgentStatusPanel Component

Ready-to-use UI component for displaying agent status.

**Features:**
- Real-time status indicator with color coding
- Task allocation metrics
- Capability display
- Error rate tracking
- Loading and error states
- Update animations

**Usage:**

```typescript
import { AgentStatusPanel } from '@/components/AgentStatusPanel'

function Dashboard() {
  const [agentId, setAgentId] = useState('agent-sr-dev')

  return (
    <AgentStatusPanel
      agentId={agentId}
      refetchInterval={10 * 1000}  // Optional
    />
  )
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agentId` | string | — | Required. The agent ID to monitor |
| `refetchInterval` | number | 10000 | Polling interval in milliseconds |

**Component Structure:**

The component renders:
1. **Agent Header** - Name, role, and status badge
2. **Status Grid** - 4 cards showing current metrics:
   - Current Status
   - Tasks In Progress
   - Tasks Completed
   - Error Rate
3. **Capabilities** - List of agent capabilities
4. **Update Indicator** - Visual feedback during polling

### 3. AgentAvailability Data Structure

```typescript
interface AgentAvailability {
  id: string
  name: string
  role: AgentRole  // 'sr-dev' | 'junior' | 'pm'
  status: AgentAvailabilityStatus  // 'idle' | 'active' | 'busy' | 'offline'
  statusChangedAt: string  // ISO timestamp
  currentTaskId?: string
  capabilities: string[]
  metadata: {
    lastActivityAt: string
    tasksCompleted: number
    tasksInProgress: number
    errorRate: number
  }
}
```

### 4. MSW Handler (Mocking)

The MSW handler simulates realistic agent state transitions.

**Endpoint:** `GET /api/agents/:id/status`

**Features:**
- Realistic state transitions (idle → active → busy → idle)
- Configurable network delays
- 5% simulated error rate for testing
- In-memory state persistence across requests

**Response:**

```json
{
  "id": "agent-sr-dev",
  "name": "Senior Dev Agent",
  "role": "sr-dev",
  "status": "active",
  "statusChangedAt": "2026-03-07T12:15:30.123Z",
  "currentTaskId": "task-1234",
  "capabilities": ["architecture", "code-review", "refactoring"],
  "metadata": {
    "lastActivityAt": "2026-03-07T12:18:45.456Z",
    "tasksCompleted": 42,
    "tasksInProgress": 1,
    "errorRate": 2
  }
}
```

## Cache Strategy

### Stale-While-Revalidate Pattern

```
Request → Check Cache
           ├─ Hit: Return cached data
           │  └─ Check staleness
           │     ├─ Fresh (< 10s): Return immediately
           │     └─ Stale: Return + refetch in background
           └─ Miss: Fetch from server
```

**Configuration:**
- `staleTime: 10 * 1000` - 10 seconds before data is considered stale
- `gcTime: 5 * 60 * 1000` - 5 minutes before cache is garbage collected
- `refetchInterval: 10 * 1000` - Poll every 10 seconds

### Garbage Collection

Cache entries are automatically cleaned up 5 minutes after the last reference. This prevents memory leaks in long-running applications.

## Real-Time Polling

### Polling Configuration

```typescript
// Default: 10-second polling
useAgentStatus('agent-id')

// Custom interval: 5 seconds
useAgentStatus('agent-id', { refetchInterval: 5 * 1000 })

// Disable automatic polling
useAgentStatus('agent-id', { refetchInterval: false })
```

### Window Focus Refetch

When users return to the browser window, the hook automatically refetches fresh data:

```typescript
// Enabled by default
const { data } = useAgentStatus('agent-id', {
  refetchOnWindowFocus: true  // default
})
```

This ensures the displayed status is always current even if the user was away.

## Error Handling

### Retry Strategy

Failed requests are retried with exponential backoff:

```
Attempt 1: Fail → 1 second delay
Attempt 2: Fail → 2 seconds delay
Attempt 3: Fail → Error state
```

Maximum wait time is capped at 30 seconds.

### Error State UI

When an error occurs:

```typescript
if (error && !data) {
  return (
    <div className="bg-red-900 border border-red-700 rounded-lg p-6">
      <p className="font-semibold">Error loading agent status</p>
      <p className="text-sm">{error.message}</p>
    </div>
  )
}
```

### Error Recovery

Users can recover from errors by:
1. Waiting for automatic retry (up to 3 attempts)
2. Leaving the page and returning (triggers refetch on focus)
3. Manually refetching with React Query devtools

## Performance Optimization

### Network Efficiency

- **Polling interval:** 10 seconds balances freshness vs. network load
- **Stale caching:** Reduces 90% of requests through local cache
- **Window focus refetch:** Only fetches when user is active
- **Connection recovery:** Automatically refetches on reconnect

### Browser Performance

- **Component memoization:** Status indicators are stable
- **Animation optimization:** Uses CSS animations instead of JS
- **Skeleton loading:** Prevents layout shift during loading
- **Error boundaries:** Prevents UI crashes from API errors

## Integration Examples

### Single Agent Monitor

```typescript
import { AgentStatusPanel } from '@/components/AgentStatusPanel'

export function AgentMonitor() {
  return (
    <div className="space-y-6">
      <AgentStatusPanel agentId="agent-sr-dev" />
      <AgentStatusPanel agentId="agent-junior" />
      <AgentStatusPanel agentId="agent-pm" />
    </div>
  )
}
```

### Dashboard with Selection

```typescript
import { useState } from 'react'
import { AgentStatusPanel } from '@/components/AgentStatusPanel'

export function Dashboard() {
  const [agentId, setAgentId] = useState('agent-sr-dev')

  const agents = [
    { id: 'agent-sr-dev', name: 'Senior Dev' },
    { id: 'agent-junior', name: 'Junior Dev' },
    { id: 'agent-pm', name: 'Project Manager' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setAgentId(agent.id)}
            className={agentId === agent.id ? 'active' : ''}
          >
            {agent.name}
          </button>
        ))}
      </div>
      <AgentStatusPanel agentId={agentId} />
    </div>
  )
}
```

### Custom Hook Usage

```typescript
import { useAgentStatus } from '@/hooks/useAgentStatus'

export function CustomAgentStatus({ agentId }: { agentId: string }) {
  const { data, isLoading, isFetching, error } = useAgentStatus(agentId)

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : data ? (
        <>
          <h2>{data.name}</h2>
          <p>Status: {data.status}</p>
          <p>Tasks: {data.metadata.tasksInProgress} in progress</p>
        </>
      ) : null}
      {isFetching && <span>Updating...</span>}
    </div>
  )
}
```

## TypeScript Support

Full type safety across the system:

```typescript
import type { AgentAvailability, AgentAvailabilityStatus } from '@/types/agent'
import type { UseAgentStatusOptions } from '@/hooks/useAgentStatus'

// Type-safe component usage
const statusData: AgentAvailability = { /* ... */ }
const options: UseAgentStatusOptions = { refetchInterval: 10000 }

// Status is validated at compile time
const status: AgentAvailabilityStatus = 'idle'  // ✓ Valid
const invalid: AgentAvailabilityStatus = 'waiting'  // ✗ Type error
```

## Testing

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentStatus } from '@/hooks/useAgentStatus'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useAgentStatus', () => {
  it('fetches agent status', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useAgentStatus('agent-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data?.name).toBe('Senior Dev Agent')
  })
})
```

### Component Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { AgentStatusPanel } from '@/components/AgentStatusPanel'

describe('AgentStatusPanel', () => {
  it('displays agent status', async () => {
    render(<AgentStatusPanel agentId="agent-sr-dev" />)

    await waitFor(() => {
      expect(screen.getByText('Senior Dev Agent')).toBeInTheDocument()
    })
  })
})
```

## Troubleshooting

### Status not updating

1. Check polling interval setting (default: 10 seconds)
2. Verify browser window is focused
3. Check browser network tab for failed requests
4. Verify agent ID is correct

### High network usage

1. Increase polling interval: `refetchInterval={30 * 1000}`
2. Disable refetch on window focus: `refetchOnWindowFocus={false}`
3. Use React Query devtools to inspect query cache

### Performance issues

1. Use pagination for multiple agents (don't display 100+ at once)
2. Increase `staleTime` for less frequent updates
3. Use component memoization for parent components
4. Check browser DevTools for unnecessary re-renders

## Browser Support

- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support (iOS 13.2+)
- IE11: ✗ Not supported (TanStack Query requires ES6+)

## API Reference

### useAgentStatus(agentId, options?)

Returns a TanStack Query result with agent availability data.

**Parameters:**
- `agentId` (string): The agent ID to monitor
- `options` (UseAgentStatusOptions, optional):
  - `refetchInterval` (number): Polling interval in ms (default: 10000)
  - `refetchOnWindowFocus` (boolean): Refetch on focus (default: true)

**Returns:**
- `data` (AgentAvailability | undefined): Agent status data
- `isLoading` (boolean): True during initial load
- `isFetching` (boolean): True during any fetch (including background)
- `error` (Error | null): Error object if fetch failed
- `status` (string): Query status ('idle', 'pending', 'error', 'success')
- `refetch` (function): Manual refetch trigger

### AgentStatusPanel Props

- `agentId` (string, required): Agent ID to display
- `refetchInterval` (number, optional): Polling interval in ms (default: 10000)

## Related Documentation

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [MSW Mock Service Worker](https://mswjs.io/)
- [React Query Devtools](https://tanstack.com/query/latest/docs/react/devtools)
