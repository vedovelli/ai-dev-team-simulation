# Sprint Comparison Data Layer Implementation

## Overview

The sprint comparison feature provides a focused hook that fetches and compares metrics for the current sprint vs. the previous sprint. This is an MVP implementation intentionally limited to current vs. previous comparison, avoiding full multi-sprint trend analysis (per YAGNI principle).

## Architecture

### Hook: `useSprintComparison`

The main hook fetches metrics for two sprints in parallel and derives comparison deltas:

```typescript
import { useSprintComparison } from '@/hooks'

function SprintComparisonPanel() {
  const { data, isLoading, isError, error } = useSprintComparison(
    'sprint-2',           // current sprint ID
    'sprint-1',           // previous sprint ID (optional)
    {
      enabled: true,       // enable/disable fetching
      refetchInterval: 30000 // polling interval (30s default)
    }
  )

  if (isLoading) return <div>Loading comparison...</div>
  if (isError) return <div>Error: {error?.message}</div>
  if (!data) return <div>No data available</div>

  return (
    <div>
      <h2>Sprint Comparison</h2>
      <MetricCard
        label="Velocity"
        current={data.current.velocity}
        previous={data.previous?.velocity}
        trend={data.deltas.velocity.trend}
        percentageChange={data.deltas.velocity.percentageChange}
      />
      <MetricCard
        label="Completion Rate"
        current={data.current.completionPercentage}
        previous={data.previous?.completionPercentage}
        trend={data.deltas.completionRate.trend}
        percentageChange={data.deltas.completionRate.percentageChange}
      />
      <MetricCard
        label="Tasks Completed"
        current={data.current.completedPoints}
        previous={data.previous?.completedPoints}
        trend={data.deltas.tasksCompleted.trend}
        percentageChange={data.deltas.tasksCompleted.percentageChange}
      />
    </div>
  )
}
```

## Data Structure

### `SprintComparisonResult`

```typescript
interface SprintComparisonResult {
  currentSprintId: string
  previousSprintId: string | null
  current: SprintMetrics
  previous: SprintMetrics | null // null if previous sprint not available
  deltas: SprintComparisonDeltas
}
```

### `SprintComparisonDeltas`

Derived comparison metrics with trend analysis:

```typescript
interface SprintComparisonDeltas {
  velocity: MetricDelta
  completionRate: MetricDelta
  tasksCompleted: MetricDelta
}

interface MetricDelta {
  value: number              // absolute change (current - previous)
  trend: 'up' | 'down' | 'neutral'
  percentageChange?: number  // percentage change (only if previous exists)
}
```

## Technical Implementation Details

### Parallel Fetching with `useQueries`

The hook uses TanStack Query's `useQueries` to fetch current and previous sprint metrics in parallel:

```typescript
const queries = useQueries({
  queries: [
    {
      queryKey: ['sprints', currentSprintId, 'metrics'],
      queryFn: () => fetch(`/api/sprints/${currentSprintId}/metrics`),
      // ... stale-while-revalidate configuration
    },
    {
      queryKey: ['sprints', previousSprintId, 'metrics'],
      queryFn: () => fetch(`/api/sprints/${previousSprintId}/metrics`),
      // ... same configuration
    },
  ],
})
```

### Graceful Degradation

If the previous sprint data is unavailable:
- Current sprint metrics are still displayed
- `previous` field in result is `null`
- `deltas` still computed (with `percentageChange` omitted)
- No error is propagated to the UI

### Loading State Handling

- `isLoading` reflects only the current sprint fetch status
- Previous sprint being fetched is acceptable (stale-while-revalidate)
- Partial data displays immediately for better UX

### Cache Strategy

- **Stale Time**: 30 seconds
- **GC Time**: 5 minutes
- **Polling**: Configurable, 30s default (disabled when tab is unfocused)
- **Retry**: 3 attempts with exponential backoff for current sprint, 1 attempt for previous

## MSW Handler

The handler at `GET /api/sprints/:id/metrics` generates metrics:

- **Known sprints** (sprint-1, sprint-2, sprint-3): Use predefined data
- **Historical sprint IDs**: Generate with ±15% variance from base metrics for realism

```typescript
// Example: comparing sprint-2 to sprint-1
// sprint-2: 6 total tasks, 3 completed, velocity ~0.4
// sprint-1: 5 total tasks, 5 completed, velocity ~0.36 (with ±15% variance)
```

## Integration Example

### Dashboard Usage

```typescript
import { useSprintComparison } from '@/hooks'

function SprintComparisonDashboard() {
  const { data, isLoading, refetch } = useSprintComparison(
    'sprint-2', // current (active) sprint
    'sprint-1', // previous (completed) sprint
  )

  if (!data) return null

  const velocityTrend = data.deltas.velocity.trend === 'up' ? '📈' : '📉'
  const completionTrend = data.deltas.completionRate.trend === 'up' ? '✅' : '⚠️'

  return (
    <div className="comparison-panel">
      <div className="metric">
        <label>Velocity Change</label>
        <span>{velocityTrend} {data.deltas.velocity.value.toFixed(2)}</span>
        {data.deltas.velocity.percentageChange && (
          <small>{data.deltas.velocity.percentageChange > 0 ? '+' : ''}{data.deltas.velocity.percentageChange}%</small>
        )}
      </div>

      <div className="metric">
        <label>Completion Rate</label>
        <span>{completionTrend} {data.current.completionPercentage}%</span>
        {data.previous && (
          <small>vs {data.previous.completionPercentage}% (Δ {data.deltas.completionRate.value}%)</small>
        )}
      </div>

      <div className="metric">
        <label>Tasks Completed</label>
        <span>{data.current.completedPoints}</span>
        {data.previous && (
          <small>vs {data.previous.completedPoints} (Δ {data.deltas.tasksCompleted.value})</small>
        )}
      </div>
    </div>
  )
}
```

## Scope

This implementation covers **current vs. previous sprint only**:

- ✅ Parallel metric fetching
- ✅ Derived delta calculations
- ✅ Trend analysis (up/down/neutral)
- ✅ Graceful handling of missing previous data
- ✅ Polling with focus management
- ❌ Multi-sprint trend analysis (out of scope)
- ❌ Advanced analytics (forecast, burndown patterns) (out of scope)

## Related Hooks

- `useSprintMetrics`: Fetch single sprint metrics with real-time polling
- `useSprintAnalytics`: Historical sprint trends and patterns
- `useSprintReport`: Sprint performance reports with data export

## Types Location

- `src/types/sprint-comparison.ts` - Type definitions
- `src/hooks/useSprintComparison.ts` - Hook implementation
- `src/mocks/handlers/sprintAnalytics.ts` - MSW handler (extended)
