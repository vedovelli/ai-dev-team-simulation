# Agent Status Dashboard Implementation

## Overview

Agent Status Dashboard demonstrates real-time agent status monitoring using TanStack Query's parallel queries pattern with auto-refresh capabilities. This feature provides both the `useAgentStatus` hook for custom use cases and a ready-to-use `AgentStatusDashboard` component.

## Architecture

### Parallel Queries Pattern

The `useAgentStatus` hook implements a two-level parallel query structure:

1. **Query 1: Agents List** - `['agents', 'list']`
   - Fetches list of all agents from `/api/agents`
   - Controls the second query execution

2. **Query 2: Individual Status** - `['agents', 'statuses']`
   - Depends on agents list query success
   - Fetches status for each agent in parallel using `Promise.all()`
   - Maps to `/api/agents/{agentId}/status` endpoints

### Data Flow

```
useAgentStatus Hook
  ├─ Query 1: List all agents
  │  ├─ Fetch: GET /api/agents
  │  └─ Result: Agent[]
  │
  └─ Query 2: Fetch all statuses (dependent, parallel)
     ├─ Enable: When Query 1 succeeds and has agents
     ├─ Fetch: GET /api/agents/{agentId}/status for each agent
     │         (All requests in parallel with Promise.all)
     ├─ Result: AgentAvailability[]
     └─ Aggregation: Count by status type (idle/working/waiting)
```

## Usage

### useAgentStatus Hook

Basic usage - automatically fetches and maintains agent status data:

```typescript
import { useAgentStatus } from '@/hooks/useAgentStatus'

export function MyComponent() {
  const { agents, aggregation, isLoading, isError, error } = useAgentStatus()

  return (
    <div>
      <div>Idle: {aggregation.idle}</div>
      <div>Working: {aggregation.working}</div>
      <div>Waiting: {aggregation.waiting}</div>
      
      {agents.map(agent => (
        <div key={agent.id}>{agent.name} - {agent.status}</div>
      ))}
    </div>
  )
}
```

With custom options:

```typescript
const { agents, aggregation } = useAgentStatus({
  refetchInterval: 10000, // Custom 10s polling
  refetchOnWindowFocus: true // Refetch when window regains focus
})
```

### useAgentStatusSingle Hook

For fetching a single agent's status:

```typescript
import { useAgentStatusSingle } from '@/hooks/useAgentStatus'

export function AgentDetail({ agentId }) {
  const { data: status, isLoading } = useAgentStatusSingle(agentId)

  return (
    <div>
      {status && (
        <div>
          <h2>{status.name}</h2>
          <p>Status: {status.status}</p>
          <p>Tasks Completed: {status.metadata.tasksCompleted}</p>
        </div>
      )}
    </div>
  )
}
```

### AgentStatusDashboard Component

Complete ready-to-use dashboard with filtering, sorting, and search:

```typescript
import { AgentStatusDashboard } from '@/components/AgentStatusDashboard'

export function MyPage() {
  return <AgentStatusDashboard />
}
```

## Features

### Status Aggregation
- Counts agents by status type: `idle`, `working`, `waiting`
- Maps availability statuses:
  - `'idle'` → idle
  - `'active'` / `'busy'` → working
  - `'offline'` → waiting

### Dashboard Features
- **Summary Cards**: Show counts for idle/working/waiting agents
- **Sortable Columns**: name, status, tasks completed, performance
- **Search**: By agent name
- **Filter**: By status type
- **Performance Tier**: Calculated from error rate
  - High: error rate ≤ 5%
  - Medium: error rate ≤ 15%
  - Low: error rate > 15%

### Auto-Refresh
- Default: 15 seconds between refetches
- Configurable per hook instance
- Respects window focus (refetches when window regains focus)
- Automatic reconnect when network reconnects

### Resilience
- Exponential backoff retry (3 attempts)
- Graceful handling of individual agent status fetch failures
- Stale-while-revalidate strategy (15s stale time, 5min cache)

## Query Keys

```typescript
// List query
['agents', 'list']

// All statuses query
['agents', 'statuses']

// Single agent status query
['agents', agentId, 'status']
```

## Data Types

### AgentStatusAggregation
```typescript
interface AgentStatusAggregation {
  idle: number      // Count of idle agents
  working: number   // Count of working agents
  waiting: number   // Count of waiting agents
}
```

### AgentAvailability
```typescript
interface AgentAvailability {
  id: string
  name: string
  role: AgentRole
  status: 'idle' | 'active' | 'busy' | 'offline'
  statusChangedAt: string
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

## API Endpoints

### GET /api/agents
Returns list of all agents:
```typescript
Agent[]
```

### GET /api/agents/:id/status
Returns current status and availability of agent:
```typescript
AgentAvailability
```

## Performance Considerations

### Query Optimization
1. **Lazy Evaluation**: Status query only runs when agents list is available
2. **Parallel Requests**: All status fetches happen concurrently
3. **Caching**: 5-minute cache time, 15-second stale time
4. **Pagination Ready**: Can be extended with pagination query params

### Loading States
- While agents list loads: `isLoading = true`
- While status queries load: `isLoading = true`
- Component shows loading spinner

### Error Handling
- Individual agent status failures don't block others
- Failed statuses filtered out from results
- Error states accessible via `isError` and `error` properties

## Files

- `src/hooks/useAgentStatus.ts` - Hook implementation
- `src/components/AgentStatusDashboard/AgentStatusDashboard.tsx` - Dashboard component
- `src/components/AgentStatusDashboard/index.ts` - Component export
- `src/pages/dashboard/AgentStatusLayout.tsx` - Demo page

## Testing

The MSW handlers in `src/mocks/handlers.ts` provide:
- Realistic agent status data generation
- State transitions (idle → active → busy → idle)
- Error simulation (5% failure rate)
- Metadata simulation (tasks, error rates)

## Related Patterns

This implementation demonstrates several architectural patterns:

1. **Parallel Queries**: Multiple independent queries running concurrently
2. **Dependent Queries**: Second query depends on first query success
3. **Aggregation**: Computing derived data from query results
4. **Dashboard Pattern**: Real-time monitoring with auto-refresh
5. **Error Resilience**: Handling partial failures gracefully
