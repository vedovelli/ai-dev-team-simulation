# Sprint Dashboard Metrics & Data Fetching Implementation

## Overview

This document describes the implementation of real-time metrics polling and data transformation for the Sprint Dashboard, as part of FAB-95.

## Features Implemented

### 1. Enhanced `useSprintMetrics` Hook

**Location:** `src/hooks/useSprintMetrics.ts`

#### Configuration Options
```typescript
interface UseSprintMetricsOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}
```

#### Key Features
- **Automatic Polling**: Refetches metrics every 30 seconds by default
- **Window Focus Refetch**: Automatically fetches fresh data when the user returns to the app
- **Exponential Backoff**: Retry logic with exponential backoff (max 3 attempts)
- **Stale-While-Revalidate**: Serves stale data while fetching new data in the background
- **Error Handling**: Graceful error messages and recovery strategies

#### Query Key Structure
```typescript
['sprints', sprintId, 'metrics']
```

#### Data Transformation
The hook automatically calculates derived metrics:
- `completionPercentage`: Task completion rate (0-100%)
- `tasksPerDay`: Velocity metric (tasks per day)
- `averageTaskCompletionTime`: Average hours per task
- `projectedCompletionDate`: Estimated sprint completion date

### 2. SprintMetricsPanel Component

**Location:** `src/components/SprintDashboard/SprintMetricsPanel.tsx`

A self-contained component that displays all sprint metrics with real-time updates.

#### Features
- Displays 8 key performance indicators
- Automatic 30-second polling via `useSprintMetrics`
- Responsive grid layout (1-4 columns)
- Loading and error states with graceful fallbacks
- Trend indicators for key metrics

#### Metrics Displayed
1. **Completion Rate** (%)
2. **Completed Tasks** (count)
3. **Remaining Tasks** (count)
4. **In Progress Tasks** (count)
5. **Task Velocity** (tasks/day)
6. **Avg. Completion Time** (hours)
7. **Projected Completion** (date)
8. **Total Tasks** (count)

### 3. Enhanced MSW Handlers

**Location:** `src/mocks/handlers/sprintAnalytics.ts`

#### New Features
- **Burndown Data Generation**: Realistic ideal vs. actual burndown curves
- **Velocity Calculations**: Automatic velocity based on task completion rate
- **Days Tracking**: Tracks days elapsed and remaining in sprint
- **Status Indicators**: `onTrack` boolean for sprint health

#### Response Structure
```typescript
{
  sprint: {
    // Sprint metadata
  },
  summary: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    remainingTasks: number
    completionPercentage: number
  },
  metrics: {
    sprintId: string
    totalPoints: number
    completedPoints: number
    remainingPoints: number
    daysRemaining: number
    daysElapsed: number
    sprintDuration: number
    velocity: number
    onTrack: boolean
    completionPercentage: number
  },
  burndownData: [{
    day: number
    ideal: number
    actual: number
    date: string
  }],
  agentWorkload: [...]
}
```

## Integration with SprintDashboard

The `SprintDashboard` component now uses `SprintMetricsPanel` which:
1. Automatically handles data fetching with polling
2. Manages loading and error states
3. Provides real-time metric updates
4. Integrates with burndown chart visualization

### Before (Hardcoded metrics)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard label="Completion Rate" value={metrics.completionPercentage} ... />
  {/* More hardcoded cards */}
</div>
```

### After (Dynamic metrics panel with polling)
```tsx
<SprintMetricsPanel
  sprintId={selectedSprintId}
  refetchInterval={30 * 1000}
/>
```

## Data Flow

```
SprintDashboard
  ↓
SprintMetricsPanel
  ↓
useSprintMetrics (polling every 30s)
  ↓
TanStack Query
  ├─ Stale-while-revalidate strategy
  ├─ Exponential backoff retry
  └─ Window focus refetch
  ↓
GET /api/sprints/:id/metrics (MSW Handler)
  ↓
generateSprintMetrics()
  ├─ burndownData generation
  ├─ velocity calculations
  └─ metrics aggregation
  ↓
Component renders updated metrics
```

## Success Criteria ✅

- ✅ Metrics update every 30 seconds automatically
- ✅ Custom hook is reusable for other analytics views
- ✅ Error states display when metrics fail to load
- ✅ Charts render correctly with transformed data (burndownData)
- ✅ Graceful handling of missing/incomplete data
- ✅ Response on window focus for fresh data
- ✅ Exponential backoff retry logic (3 attempts)

## Usage Examples

### Basic Usage
```typescript
import { useSprintMetrics } from '@/hooks/useSprintMetrics'

function MyMetricsComponent({ sprintId }: { sprintId: string }) {
  const { metrics, isLoading, error } = useSprintMetrics(sprintId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>Completion: {metrics?.completionPercentage}%</div>
}
```

### Custom Polling Interval
```typescript
const { metrics } = useSprintMetrics(sprintId, {
  refetchInterval: 60 * 1000, // Poll every 60 seconds
  refetchOnWindowFocus: false, // Disable window focus refetch
})
```

### Use in SprintMetricsPanel
```typescript
<SprintMetricsPanel
  sprintId="sprint-2"
  refetchInterval={30 * 1000}
/>
```

## Query Keys

All sprint metrics queries use this key structure:
```typescript
['sprints', sprintId, 'metrics']
```

This enables:
- Manual invalidation: `queryClient.invalidateQueries({ queryKey: ['sprints', 'sprint-2', 'metrics'] })`
- Selective updates on sprint changes
- Easy debugging in React Query DevTools

## Performance Considerations

1. **Stale-while-revalidate** (30s stale time): Immediate UX while fetching
2. **gcTime of 5 minutes**: Cached data survives app navigation
3. **Exponential backoff**: Prevents server overload during errors
4. **Selective refetch**: Only refetches on window focus if enabled
5. **No unnecessary renders**: Data transformation happens in hook

## Error Handling

The implementation includes robust error handling:
- Network errors with descriptive messages
- Retry logic with exponential backoff
- Graceful fallbacks to cached data
- Error state UI in SprintMetricsPanel
- User-friendly error messages

## Testing Considerations

The MSW handlers provide:
- Realistic mock data with variations
- Configurable sprint states (planning, active, completed)
- Time-series data for burndown charts
- Predictable agent workload patterns

## Migration Notes

For teams migrating from the old hardcoded metrics:
1. Replace metric grid with `<SprintMetricsPanel sprintId={id} />`
2. Update TypeScript to use `useSprintMetrics` directly if needed
3. Adjust `refetchInterval` if default 30s doesn't fit your needs
4. Test with React Query DevTools to monitor query behavior

## Future Enhancements

Possible improvements for future iterations:
- Customizable metric selection
- Historical metrics comparison
- Alert thresholds for off-track sprints
- Export metrics to CSV
- Custom metric calculators
- WebSocket support for live updates
