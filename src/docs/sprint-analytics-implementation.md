# Sprint Analytics & Historical Metrics Implementation Guide

## Overview

This document describes the sprint analytics data layer, which provides multi-sprint historical metrics for sprint planning dashboards and predictive features. Enables trend analysis across velocity, capacity, burndown patterns, and forecast accuracy.

## Architecture

The sprint analytics system follows the established TanStack Query + MSW pattern:

```
Sprint Planning Dashboard
    ↓
useSprintAnalytics(sprintId, options) Hook
    ↓
TanStack Query (Query with 1h stale time)
    ↓
Fetch API
    ↓
MSW Handlers (Development/Testing)
    ↓
API Endpoints (Production)
```

## Components

### Types (`src/types/sprint.ts`)

**VelocityTrendDataPoint**
Historical velocity data for trend analysis:
```typescript
{
  sprintId: string              // Sprint identifier
  sprintName: string            // Sprint name for display
  velocity: number              // Tasks completed (actual)
  plannedVelocity: number       // Originally planned velocity
  date: string                  // Sprint end date (ISO 8601)
}
```

**CapacityUtilizationDataPoint**
Team capacity metrics per sprint:
```typescript
{
  sprintId: string              // Sprint identifier
  sprintName: string            // Sprint name
  utilizationRate: number       // 0-100 percentage
  allocatedCapacity: number     // Capacity allocated to tasks
  availableCapacity: number     // Unused capacity
  totalCapacity: number         // Total team capacity
  date: string                  // Sprint date (ISO 8601)
}
```

**BurndownPatternAnalysis**
Analysis of burndown curve characteristics:
```typescript
{
  sprintId: string              // Sprint identifier
  sprintName: string            // Sprint name
  avgDailyCompletionRate: number// Tasks completed per day (average)
  steadiness: number            // 0-100, consistency of completion
  hasEarlyBurst: boolean        // High completion early in sprint
  hasEndSpurt: boolean          // High completion late in sprint
  peakCompletionDay: number     // 0-based day with highest completion
}
```

**ForecastAccuracy**
Forecast vs. actual completion comparison:
```typescript
{
  sprintId: string              // Sprint identifier
  sprintName: string            // Sprint name
  projectedCompletionDate: string // Forecasted date (ISO 8601)
  actualCompletionDate: string    // Actual date (ISO 8601)
  daysVariance: number          // Positive = late, negative = early
  accuracyScore: number         // 0-100, forecast accuracy percentage
}
```

**SprintAnalyticsData** (Response)
Complete analytics response:
```typescript
{
  sprintId: string                    // Current sprint being analyzed
  range: number                       // Number of historical sprints
  velocityTrends: VelocityTrendDataPoint[]
  capacityUtilization: CapacityUtilizationDataPoint[]
  burndownPatterns: BurndownPatternAnalysis[]
  forecastAccuracy: ForecastAccuracy[]
  summary: {
    averageVelocity: number           // Mean velocity across period
    velocityTrend: 'improving' | 'stable' | 'declining'
    averageCapacityUtilization: number// Mean utilization %
    forecastAccuracyRate: number      // Mean accuracy score
    recommendedVelocity: number       // Conservative estimate for planning
  }
}
```

### Hook (`src/hooks/useSprintAnalytics.ts`)

**Features**
- Fetch multi-sprint analytics with TanStack Query
- 1-hour stale time (historical data is stable)
- 24-hour garbage collection
- Exponential backoff retry (3 attempts)
- Configurable range (1–12 past sprints)
- Optional metrics filtering for optimization
- Query deduplication by range and metrics

**API**
```typescript
const {
  data,              // SprintAnalyticsData object
  isLoading,         // Loading state
  isError,           // Error state
  error,             // Error object
  isFetching,        // Refetch in progress
  refetch,           // Manual refetch function
} = useSprintAnalytics(sprintId, options)
```

**Options Interface**
```typescript
interface UseSprintAnalyticsOptions {
  range?: number                              // 1–12, default: 5
  metrics?: ('velocity' | 'burndown' | 'capacity' | 'forecast')[]
  enabled?: boolean                           // default: true
  refetchInterval?: number                    // ms, default: 1 hour
}
```

**Usage Example**
```typescript
import { useSprintAnalytics } from '@/hooks'

function SprintPlanningDashboard({ sprintId }: { sprintId: string }) {
  const { data: analytics, isLoading, error } = useSprintAnalytics(sprintId, {
    range: 5,
    metrics: ['velocity', 'capacity']
  })

  if (isLoading) return <div>Loading analytics...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Sprint Analytics</h2>
      <p>Average Velocity: {analytics?.summary.averageVelocity.toFixed(1)} tasks/sprint</p>
      <p>Recommended Velocity: {analytics?.summary.recommendedVelocity.toFixed(1)} tasks</p>
      <p>Velocity Trend: {analytics?.summary.velocityTrend}</p>
      <p>Capacity Utilization: {analytics?.summary.averageCapacityUtilization}%</p>
      <p>Forecast Accuracy: {analytics?.summary.forecastAccuracyRate}%</p>

      <VelocityTrendChart data={analytics?.velocityTrends} />
      <CapacityChart data={analytics?.capacityUtilization} />
      <BurndownPatternsTable data={analytics?.burndownPatterns} />
    </div>
  )
}
```

### MSW Handler (`src/mocks/handlers/sprint-analytics.ts`)

**Endpoint**
```
GET /api/sprints/:id/analytics?range=5&metrics=velocity,capacity
```

**Query Parameters**
- `range`: number of past sprints (default: 5, max: 12)
- `metrics`: comma-separated filter (optional, for future optimization)

**Response**
Returns `SprintAnalyticsData` with:
- Multi-sprint velocity trends (improving, stable, or declining)
- Capacity utilization patterns
- Burndown curve characteristics and patterns
- Forecast accuracy comparison
- Summary statistics for planning

**Implementation Details**
- Generates realistic historical sprint data
- Velocity trends show improving trajectory with variance
- Capacity utilization between 60–80% (realistic team loads)
- Burndown patterns include early bursts and end spurts
- Forecast accuracy 70–100% (realistic planning accuracy)
- 100–200ms simulated latency for realistic polling

## Query Key Structure

```typescript
['sprints', sprintId, 'analytics', { range, metrics }]
```

Example: `['sprints', 'sprint-5', 'analytics', { range: 5, metrics: undefined }]`

## Cache Strategy

- **Stale Time**: 1 hour (3,600,000 ms)
  - Historical data is stable and doesn't change frequently
  - Allows for longer cache validity than real-time metrics
  - Reduces unnecessary refetches during planning sessions

- **Garbage Collection**: 24 hours (86,400,000 ms)
  - Removes unused analytics data after 1 day
  - Planning dashboards may be accessed infrequently
  - Minimal memory impact for long-lived sessions

- **Refetch on Focus**: Enabled by default
  - User returns to dashboard → automatic refresh
  - Ensures latest trends visible for planning decisions

## Retry Strategy

- **Attempts**: 3 maximum
- **Backoff**: Exponential (1s → 2s → 4s, max 30s)
- Automatically retries on network failures
- User-initiated `refetch()` always retries

## Integration Examples

### Sprint Planning Dashboard with Summary

```typescript
import { useSprintAnalytics } from '@/hooks'

function SprintPlanning({ currentSprintId }: { currentSprintId: string }) {
  const { data: analytics, isLoading } = useSprintAnalytics(currentSprintId, {
    range: 8,  // Look at last 8 sprints
  })

  if (isLoading) return <LoadingSpinner />

  const { summary } = analytics!
  const recommendedCapacity = summary.recommendedVelocity

  return (
    <div className="sprint-planning">
      <h2>Plan Next Sprint</h2>

      <Card>
        <CardHeader>Historical Metrics</CardHeader>
        <CardContent>
          <Metric
            label="Average Velocity"
            value={summary.averageVelocity.toFixed(1)}
            unit="tasks/sprint"
          />
          <Metric
            label="Recommended Capacity"
            value={recommendedCapacity.toFixed(1)}
            unit="tasks"
            helpText="Conservative estimate (95% of average)"
          />
          <Trend
            label="Velocity Trend"
            value={summary.velocityTrend}
            color={summary.velocityTrend === 'improving' ? 'green' : 'neutral'}
          />
          <Metric
            label="Avg Capacity Utilization"
            value={summary.averageCapacityUtilization}
            unit="%"
          />
          <Metric
            label="Forecast Accuracy"
            value={summary.forecastAccuracyRate}
            unit="%"
          />
        </CardContent>
      </Card>

      <VelocityTrendChart data={analytics.velocityTrends} />
      <CapacityUtilizationChart data={analytics.capacityUtilization} />
    </div>
  )
}
```

### Analytics Display with Detailed Breakdown

```typescript
function SprintAnalyticsPanel({ sprintId }: { sprintId: string }) {
  const { data: analytics, isLoading, refetch } = useSprintAnalytics(sprintId)

  if (isLoading) return <Skeleton />

  return (
    <div className="analytics-panel">
      <header>
        <h3>Sprint {analytics?.sprintId} Analytics</h3>
        <button onClick={() => refetch()}>Refresh</button>
      </header>

      {/* Velocity Trends Section */}
      <section>
        <h4>Velocity Trends (Last {analytics?.range} Sprints)</h4>
        <table>
          <thead>
            <tr>
              <th>Sprint</th>
              <th>Actual Velocity</th>
              <th>Planned Velocity</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.velocityTrends.map((trend) => (
              <tr key={trend.sprintId}>
                <td>{trend.sprintName}</td>
                <td>{trend.velocity.toFixed(1)}</td>
                <td>{trend.plannedVelocity.toFixed(1)}</td>
                <td>{(trend.velocity - trend.plannedVelocity).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Capacity Utilization Section */}
      <section>
        <h4>Capacity Utilization</h4>
        <ul>
          {analytics?.capacityUtilization.map((cap) => (
            <li key={cap.sprintId}>
              {cap.sprintName}: {cap.utilizationRate}%
              ({cap.allocatedCapacity}/{cap.totalCapacity})
            </li>
          ))}
        </ul>
      </section>

      {/* Burndown Patterns Section */}
      <section>
        <h4>Burndown Patterns</h4>
        <ul>
          {analytics?.burndownPatterns.map((pattern) => (
            <li key={pattern.sprintId}>
              <strong>{pattern.sprintName}</strong>
              <ul>
                <li>Avg Daily Completion: {pattern.avgDailyCompletionRate.toFixed(1)} tasks/day</li>
                <li>Steadiness: {pattern.steadiness}%</li>
                <li>Early Burst: {pattern.hasEarlyBurst ? 'Yes' : 'No'}</li>
                <li>End Spurt: {pattern.hasEndSpurt ? 'Yes' : 'No'}</li>
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Forecast Accuracy Section */}
      <section>
        <h4>Forecast Accuracy</h4>
        <table>
          <thead>
            <tr>
              <th>Sprint</th>
              <th>Projected</th>
              <th>Actual</th>
              <th>Variance (Days)</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.forecastAccuracy.map((forecast) => (
              <tr key={forecast.sprintId}>
                <td>{forecast.sprintName}</td>
                <td>{forecast.projectedCompletionDate}</td>
                <td>{forecast.actualCompletionDate}</td>
                <td className={forecast.daysVariance > 0 ? 'late' : 'early'}>
                  {forecast.daysVariance > 0 ? '+' : ''}{forecast.daysVariance}
                </td>
                <td>{forecast.accuracyScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
```

### Filtered Analytics (Specific Metrics Only)

```typescript
function VelocityForecastWidget({ sprintId }: { sprintId: string }) {
  // Only fetch velocity and forecast metrics, skip burndown/capacity
  const { data: analytics } = useSprintAnalytics(sprintId, {
    range: 6,
    metrics: ['velocity', 'forecast'],
  })

  return (
    <Card className="forecast-widget">
      <h3>Velocity Forecast</h3>

      <div className="trend">
        <p>Trend: {analytics?.summary.velocityTrend}</p>
        <p>Avg: {analytics?.summary.averageVelocity.toFixed(1)} tasks/sprint</p>
        <p>Recommended: {analytics?.summary.recommendedVelocity.toFixed(1)}</p>
      </div>

      <div className="accuracy">
        <p>Historical Accuracy: {analytics?.summary.forecastAccuracyRate}%</p>
      </div>
    </Card>
  )
}
```

## Testing

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useSprintAnalytics } from '@/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useSprintAnalytics', () => {
  it('fetches sprint analytics data', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(
      () => useSprintAnalytics('sprint-5', { range: 5 }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.sprintId).toBe('sprint-5')
    expect(result.current.data?.range).toBe(5)
    expect(result.current.data?.velocityTrends.length).toBeGreaterThan(0)
    expect(result.current.data?.summary.averageVelocity).toBeGreaterThan(0)
  })

  it('uses correct query key', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    renderHook(() => useSprintAnalytics('sprint-5', { range: 5 }), { wrapper })

    const key = ['sprints', 'sprint-5', 'analytics', { range: 5, metrics: undefined }]
    expect(queryClient.getQueryData(key)).toBeDefined()
  })

  it('respects enabled option', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(
      () => useSprintAnalytics('sprint-5', { enabled: false }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('filters metrics correctly', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(
      () => useSprintAnalytics('sprint-5', { metrics: ['velocity', 'capacity'] }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const key = [
      'sprints',
      'sprint-5',
      'analytics',
      { range: 5, metrics: ['capacity', 'velocity'] }
    ]
    expect(queryClient.getQueryData(key)).toBeDefined()
  })
})
```

## Acceptance Criteria Checklist

- [x] `useSprintAnalytics(sprintId, options)` implemented with TanStack Query
- [x] Query key: `['sprints', sprintId, 'analytics', options]`
- [x] Stale time: 1 hour, gc time: 24 hours
- [x] MSW handler: `GET /api/sprints/:id/analytics?range=...&metrics=...`
- [x] Handler returns realistic multi-sprint analytics data
- [x] Velocity trend, capacity, burndown, and forecast metrics computed
- [x] Summary statistics: averageVelocity, velocityTrend, avgCapacity, accuracy, recommendedVelocity
- [x] Exponential backoff retry (3 attempts)
- [x] TypeScript strict, no `any` casts
- [x] Integrates cleanly with existing SprintMetricsPanel patterns
- [x] Implementation guide with usage examples
