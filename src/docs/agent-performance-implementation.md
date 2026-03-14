# Agent Performance Analytics Implementation Guide

## Overview

This document describes the agent performance analytics system, which provides per-agent KPIs for sprint dashboards and workload analysis. Expands the analytics layer beyond `useSprintMetrics` to enable per-agent decision-making.

## Architecture

The agent performance system follows the established TanStack Query + MSW pattern:

```
Dashboard Components (Agent Cards, Analytics)
    ↓
useAgentPerformance(agentId) Hook
    ↓
TanStack Query (Query)
    ↓
Fetch API
    ↓
MSW Handlers (Development/Testing)
    ↓
API Endpoints (Production)
```

## Components

### Types (`src/types/agent-performance.ts`)

**AgentPerformance**
Per-agent KPI object returned by the hook:
```typescript
{
  agentId: string              // Unique agent identifier
  tasksCompleted: number       // Total tasks completed
  velocity: number             // Tasks completed per day (average)
  onTimeRate: number           // On-time delivery rate (0-100%)
  avgCompletionDays: number    // Average days to complete a task
  updatedAt: string            // ISO timestamp
}
```

### Hook (`src/hooks/useAgentPerformance.ts`)

**Features**
- Fetch per-agent performance KPIs with TanStack Query
- 2-minute stale time (performance data updates frequently)
- 5-minute garbage collection
- Exponential backoff retry (3 attempts)
- Automatic refetch on window focus
- Type-safe return with full TypeScript support

**API**
```typescript
const {
  // Query state
  data,              // Raw query data
  isLoading,         // Query loading state
  isPending,         // Query pending state
  error,             // Query error
  refetch,           // Manual refetch function

  // Computed values
  performance,       // AgentPerformance object

  // Status
  status,            // 'pending' | 'error' | 'success'
  isError,           // boolean
  isSuccess,         // boolean
} = useAgentPerformance(agentId)
```

**Usage Example**
```typescript
import { useAgentPerformance } from '@/hooks'

function AgentPerformanceCard({ agentId }: { agentId: string }) {
  const { performance, isLoading, error } = useAgentPerformance(agentId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h3>{agentId}</h3>
      <p>Completed: {performance?.tasksCompleted}</p>
      <p>Velocity: {performance?.velocity.toFixed(2)} tasks/day</p>
      <p>On-Time Rate: {performance?.onTimeRate}%</p>
      <p>Avg Completion: {performance?.avgCompletionDays.toFixed(1)} days</p>
    </div>
  )
}
```

### MSW Handler (`src/mocks/handlers/agent-performance.ts`)

**Endpoint**
```
GET /api/agents/:agentId/performance
```

**Response**
Returns `AgentPerformance` object with:
- Realistic per-agent performance profiles
- Consistent variation across agents (alice=92% on-time, bob=85%, carol=95%, etc.)
- Random data for unknown agent IDs

**Implementation Details**
- Predefined performance profiles for alice, bob, carol, david, eve
- Each agent has unique velocity and on-time rate characteristics
- Unknown agents receive randomized performance data

## Query Key Structure

```typescript
['agents', agentId, 'performance']
```

Example: `['agents', 'alice', 'performance']`

## Cache Strategy

- **Stale Time**: 2 minutes (120,000 ms)
  - Performance data updates frequently during sprints
  - Regular polling keeps dashboards responsive
  - Stale data acceptable for short intervals

- **Garbage Collection**: 5 minutes (300,000 ms)
  - Removes cache after 5 minutes of no access
  - Balances memory with refetch penalty

- **Refetch on Focus**: Enabled by default
  - User returns to dashboard → automatic refresh
  - Ensures latest performance metrics visible

## Retry Strategy

- **Attempts**: 3 maximum
- **Backoff**: Exponential (1s → 2s → 4s max 30s)
- Automatically retries on network failures
- User-initiated `refetch()` always retries

## Integration Examples

### Multi-Agent Dashboard (Using `useQueries`)

```typescript
import { useQueries } from '@tanstack/react-query'
import { useAgentPerformance } from '@/hooks'

function AgentDashboard({ agentIds }: { agentIds: string[] }) {
  // Fetch performance for multiple agents in parallel
  const queries = useQueries({
    queries: agentIds.map((agentId) => ({
      queryKey: ['agents', agentId, 'performance'],
      queryFn: async () => {
        const response = await fetch(`/api/agents/${agentId}/performance`)
        return response.json()
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })),
  })

  if (queries.some((q) => q.isPending)) return <div>Loading...</div>
  if (queries.some((q) => q.isError)) return <div>Error loading agents</div>

  return (
    <div>
      {queries.map((query, idx) => (
        <AgentCard key={agentIds[idx]} performance={query.data} />
      ))}
    </div>
  )
}
```

### Single Agent Card

```typescript
import { useAgentPerformance } from '@/hooks'

function SingleAgentCard({ agentId }: { agentId: string }) {
  const { performance, isLoading, error, refetch } = useAgentPerformance(agentId)

  if (isLoading) return <Skeleton />
  if (error) return <ErrorAlert error={error} onRetry={() => refetch()} />

  return (
    <Card>
      <CardHeader>{agentId}</CardHeader>
      <CardContent>
        <Stat label="Tasks Completed" value={performance?.tasksCompleted} />
        <Stat label="Velocity" value={`${performance?.velocity.toFixed(2)}/day`} />
        <Stat label="On-Time Rate" value={`${performance?.onTimeRate}%`} />
        <Stat label="Avg Completion" value={`${performance?.avgCompletionDays.toFixed(1)}d`} />
      </CardContent>
    </Card>
  )
}
```

## Testing

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentPerformance } from '@/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useAgentPerformance', () => {
  it('fetches agent performance data', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useAgentPerformance('alice'), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.performance?.agentId).toBe('alice')
    expect(result.current.performance?.tasksCompleted).toBeGreaterThan(0)
    expect(result.current.performance?.onTimeRate).toBeGreaterThanOrEqual(0)
    expect(result.current.performance?.onTimeRate).toBeLessThanOrEqual(100)
  })

  it('uses correct query key', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useAgentPerformance('alice'), { wrapper })

    expect(queryClient.getQueryData(['agents', 'alice', 'performance'])).toBeDefined()
  })
})
```

## Acceptance Criteria Checklist

- [x] `useAgentPerformance(agentId)` returns typed KPI object
- [x] TanStack Query key: `['agents', agentId, 'performance']`
- [x] Stale time: 2min, gc time: 5min
- [x] MSW handler at `GET /api/agents/:agentId/performance` with realistic data
- [x] Exponential backoff retry (3 attempts)
- [x] TypeScript strict, no `any` casts
- [x] 1–2 commits
