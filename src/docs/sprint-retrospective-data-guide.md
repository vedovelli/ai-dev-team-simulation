# Sprint Retrospective Data Layer Implementation Guide

## Overview

The Sprint Retrospective data layer provides comprehensive analytics for sprint performance analysis, including velocity trends, burndown analysis, team performance metrics, and historical comparisons across the last 6 months.

## Architecture

### Type System (`src/types/sprint-retrospective.ts`)

The type definitions are organized into logical groups:

- **Velocity Analysis**: `VelocityDataPoint` - tracks planned vs actual velocity per sprint
- **Burndown Analysis**: `BurndownAnalysis` - analyzes task completion patterns and steadiness
- **Burndown Comparison**: `BurndownComparison` - compares patterns across sprints
- **Team Performance**: `TeamPerformanceMetrics` - aggregates team-level KPIs
- **Agent Performance**: `AgentPerformanceData` - individual contributor metrics
- **Team Aggregation**: `TeamPerformanceAggregation` - trends across sprints
- **Chart Data**: `ChartDataPoint` - {x, y} format for chart consumption
- **Complete Data**: `SprintRetrospectiveData` - unified response structure
- **Historical Data**: `HistoricalSprintData` - source data for retrospective analysis

### Pure Functions (`src/utils/retrospective-calculations.ts`)

All calculations are pure functions with no side effects, making them testable and reusable.

#### Velocity Calculations

```typescript
// Calculate velocity trend from historical sprints
calculateVelocityTrend(sprints: HistoricalSprintData[]): {
  dataPoints: VelocityDataPoint[]
  average: number
  trend: 'improving' | 'stable' | 'declining'
}

// Convert velocity data to chart format
velocityDataToChart(dataPoints: VelocityDataPoint[]): ChartDataPoint[]
```

**Example:**
```typescript
const trend = calculateVelocityTrend(sprints)
console.log(`Average velocity: ${trend.average}`)
console.log(`Trend: ${trend.trend}`)
```

#### Burndown Analysis

```typescript
// Analyze burndown for a single sprint
analyzeBurndown(
  sprintId: string,
  sprintName: string,
  totalTasks: number,
  dailyCompletions: number[]
): BurndownAnalysis

// Compare burndown patterns across sprints
compareBurndowns(analyses: BurndownAnalysis[]): BurndownComparison

// Convert burndown to chart format
burndownDataToChart(analysis: BurndownAnalysis): ChartDataPoint[]
```

**Example:**
```typescript
const analysis = analyzeBurndown('sprint-1', 'Sprint 1', 50, [5, 4, 6, 3, 7, 4, 5])
console.log(`Steadiness: ${analysis.steadiness}%`) // 0-100
console.log(`Has early burst: ${analysis.hasEarlyBurst}`)
console.log(`Has end spurt: ${analysis.hasEndSpurt}`)
```

#### Team Performance

```typescript
// Calculate team performance metrics
calculateTeamPerformance(
  sprintId: string,
  sprintName: string,
  taskCount: number,
  completedCount: number,
  inProgressCount: number,
  canceledCount: number,
  totalCycleTimeHours: number,
  teamSize: number,
  allocatedCapacity: number,
  availableCapacity: number
): TeamPerformanceMetrics

// Aggregate metrics across sprints
aggregateTeamPerformance(metrics: TeamPerformanceMetrics[]): {
  sprints: TeamPerformanceMetrics[]
  avgCompletionRate: number
  avgCycleTime: number
  avgCapacityUtilization: number
  completionRateTrend: 'improving' | 'stable' | 'declining'
  cycleTimeTrend: 'improving' | 'stable' | 'declining'
}

// Calculate health score (0-100)
calculateHealthScore(metrics: TeamPerformanceMetrics): number
```

**Example:**
```typescript
const metrics = calculateTeamPerformance('sprint-1', 'Sprint 1', 50, 42, 3, 1, 320, 4, 336, 160)
console.log(`Completion rate: ${metrics.completionRate}%`)
console.log(`Avg cycle time: ${metrics.avgCycleTime} hours`)

const score = calculateHealthScore(metrics)
console.log(`Health score: ${score}/100`)
```

### MSW Handlers (`src/mocks/handlers/sprint-retrospective.ts`)

#### Endpoints

**GET `/api/sprints/:id/retrospective`**
Returns complete retrospective data for a sprint, including velocity trends, burndown analysis, and team performance metrics.

Response: `SprintRetrospectiveData`

```bash
curl http://localhost:3000/api/sprints/sprint-1/retrospective
```

**GET `/api/sprints/retrospective/historical`**
Returns historical sprint data for the last 6 months (6 sprints).

Response: `HistoricalSprintData[]`

```bash
curl http://localhost:3000/api/sprints/retrospective/historical
```

#### Data Generation

The handlers generate realistic mock data with:
- 6 historical sprints spanning 3 months
- Simulated improving velocity trend
- Realistic burndown patterns with variance
- Team performance data with capacity utilization
- Agent-level contribution metrics
- 200-400ms artificial latency

### Hook (`src/hooks/useSprintRetrospective.ts`)

The `useSprintRetrospective` hook provides type-safe access to retrospective data.

#### API

```typescript
function useSprintRetrospective(
  sprintId: string,
  options?: UseSprintRetrospectiveOptions
): UseSprintRetrospectiveReturn
```

#### Options

```typescript
interface UseSprintRetrospectiveOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
  /** Enable automatic refetch when connection is restored (default: true) */
  refetchOnReconnect?: boolean
}
```

#### Return Type

```typescript
interface UseSprintRetrospectiveReturn {
  // Query state
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  status: 'pending' | 'error' | 'success'

  // Data
  retrospectiveData: SprintRetrospectiveData | undefined
  historicalSprints: HistoricalSprintData[] | undefined

  // Computed values (shortcuts to data fields)
  sprintName: string | undefined
  healthScore: number | undefined
  velocityTrend: VelocityTrend | undefined
  burndownAnalysis: BurndownAnalysis | undefined
  teamPerformance: TeamPerformance | undefined
  summary: Summary | undefined

  // Actions
  refetch: () => Promise<void>
}
```

#### Caching Strategy

- **Stale Time**: 5 minutes
- **GC Time**: 10 minutes
- **Refetch on Focus**: Yes (configurable)
- **Refetch on Reconnect**: Yes (configurable)
- **Retry**: 3 attempts with exponential backoff (1s, 2s, 4s... up to 30s)

### Usage Examples

#### Basic Data Fetching

```tsx
import { useSprintRetrospective } from '@/hooks'

export function SprintRetrospectiveView({ sprintId }: { sprintId: string }) {
  const { isLoading, error, retrospectiveData } = useSprintRetrospective(sprintId)

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <h2>{retrospectiveData?.sprintName}</h2>
      <HealthScoreBadge score={retrospectiveData?.summary.healthScore} />
      <VelocityTrendChart data={retrospectiveData?.velocityTrend.chartData} />
      <BurndownChart data={retrospectiveData?.burndownAnalysis.chartData} />
      <TeamMetricsTable metrics={retrospectiveData?.teamPerformance.metrics} />
    </div>
  )
}
```

#### Accessing Computed Values

```tsx
export function SprintHealthSummary({ sprintId }: { sprintId: string }) {
  const {
    sprintName,
    healthScore,
    velocityTrend,
    burndownAnalysis,
    teamPerformance,
  } = useSprintRetrospective(sprintId)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>{sprintName}</h3>
        <HealthScore value={healthScore} />
      </div>
      <div>
        <p>Velocity Trend: {velocityTrend?.trend}</p>
        <p>Average Cycle Time: {teamPerformance?.metrics.avgCycleTime}h</p>
        <p>Completion Rate: {teamPerformance?.metrics.completionRate}%</p>
      </div>
    </div>
  )
}
```

#### Manual Refetching

```tsx
export function RetrospectiveRefresh({ sprintId }: { sprintId: string }) {
  const { refetch, isFetching } = useSprintRetrospective(sprintId)

  return (
    <button onClick={() => refetch()} disabled={isFetching}>
      {isFetching ? 'Refreshing...' : 'Refresh Data'}
    </button>
  )
}
```

#### With Custom Configuration

```tsx
const { retrospectiveData } = useSprintRetrospective('sprint-1', {
  refetchOnWindowFocus: false, // Disable focus refetch
  refetchOnReconnect: true,    // Keep reconnect refetch enabled
})
```

#### Using Historical Data

```tsx
export function MultiSprintComparison() {
  const { historicalSprints, retrospectiveData } = useSprintRetrospective('sprint-1')

  return (
    <div>
      <h2>6-Month Trend</h2>
      <VelocityTrendChart
        data={retrospectiveData?.velocityTrend.chartData}
        sprints={historicalSprints}
      />
      <TeamPerformanceTable metrics={retrospectiveData?.teamPerformance.aggregation} />
    </div>
  )
}
```

## Data Flow

```
MSW Handler (sprintRetrospectiveHandlers)
  ↓
Generates HistoricalSprintData for 6 sprints
  ↓
Calculation Functions (pure functions)
  - calculateVelocityTrend()
  - analyzeBurndown()
  - calculateTeamPerformance()
  ↓
SprintRetrospectiveData (aggregated)
  ↓
useSprintRetrospective Hook (TanStack Query)
  ↓
Cache (5min stale, 10min gc)
  ↓
React Components
```

## Metrics Explained

### Velocity
- **Planned Velocity**: Tasks estimated for the sprint
- **Actual Velocity**: Tasks completed in the sprint
- **Trend**: Improving/stable/declining based on historical comparison

### Burndown
- **Burndown Rate**: Average tasks completed per day
- **Steadiness**: 0-100 measure of consistency (higher = more consistent)
- **Early Burst**: >40% of work completed in first 30% of sprint
- **End Spurt**: >30% of work completed in last 30% of sprint

### Team Performance
- **Completion Rate**: Percentage of tasks completed (target: 80%)
- **Avg Cycle Time**: Average hours from start to completion (target: <24h)
- **Capacity Utilization**: Percentage of team capacity allocated (target: 70%)
- **Health Score**: 0-100 composite metric based on all factors

### Agent Performance
- **Tasks Completed**: Individual contributor output
- **Avg Cycle Time**: Individual contributor efficiency
- **Velocity Contribution**: Percentage of sprint velocity from this agent
- **Capacity Utilization**: Individual capacity usage

## Performance Considerations

- **Query Keys**: `['sprints', sprintId, 'retrospective']` and `['sprints', 'retrospective', 'historical']`
- **Network**: 200-400ms artificial latency per request
- **Cache**: 5min stale time with 10min garbage collection
- **Refetches**: Window focus and reconnect enabled by default
- **Retries**: 3 attempts with exponential backoff

## Testing

The pure calculation functions can be tested independently:

```typescript
import { calculateVelocityTrend, analyzeBurndown, calculateHealthScore } from '@/utils/retrospective-calculations'

describe('Velocity Calculations', () => {
  it('should calculate improving trend', () => {
    const sprints = [
      { ..., actualVelocity: 30 },
      { ..., actualVelocity: 32 },
      { ..., actualVelocity: 35 },
    ]
    const result = calculateVelocityTrend(sprints)
    expect(result.trend).toBe('improving')
  })
})

describe('Burndown Analysis', () => {
  it('should detect early burst', () => {
    const analysis = analyzeBurndown('s1', 'Sprint 1', 50, [20, 15, 5, 3, 2, 1, 1, 1, 1, 1])
    expect(analysis.hasEarlyBurst).toBe(true)
  })
})

describe('Health Score', () => {
  it('should return maximum score for perfect metrics', () => {
    const metrics = {
      completionRate: 100,
      avgCycleTime: 18,
      capacityUtilization: 100,
    }
    const score = calculateHealthScore(metrics as any)
    expect(score).toBeGreaterThanOrEqual(80) // Allow some variance
  })
})
```

## Future Extensions

1. **Custom Date Ranges**: Allow fetching retrospective data for any date range
2. **Multiple Sprint Comparison**: Compare specific sprint sets side-by-side
3. **Predictive Analytics**: Forecast completion dates based on velocity trends
4. **Agent Trends**: Track individual agent performance over time
5. **Cycle Time Distribution**: Analyze task cycle time variance
6. **Dependency Impact Analysis**: Measure impact of blocked tasks on burndown

## Related Issues

- Planning: #379
- Downstream: Sprint Retrospective UI component (FAB-190)
