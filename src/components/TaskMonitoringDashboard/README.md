# Task Monitoring Dashboard

A high-performance, real-time task monitoring dashboard component that combines TanStack Query's polling capabilities with TanStack Virtual's efficient rendering for monitoring hundreds of task items simultaneously.

## Features

- **Real-time Polling**: Smart polling intervals for live task status updates
- **Virtual Scrolling**: Renders 500+ tasks without performance degradation
- **Progress Indicators**: Visual progress bars showing task completion status
- **Error Handling**: Graceful error states with manual retry capabilities
- **Filtering**: Filter tasks by status, team, or assignee
- **Sorting**: Click column headers to sort by any field
- **Responsive Design**: Fully responsive with accessible markup

## Components

### TaskMonitoringDashboard

Main dashboard component for monitoring task execution.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function TaskPage() {
  return (
    <TaskMonitoringDashboard
      pollIntervalMs={5000}
      statusFilter="in-progress"
      teamFilter="frontend"
    />
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pollIntervalMs` | number | 5000 | Polling interval in milliseconds |
| `statusFilter` | TaskStatus \| null | null | Filter by task status (backlog, in-progress, in-review, done) |
| `teamFilter` | string \| null | null | Filter by team name |
| `assigneeFilter` | string \| null | null | Filter by assignee |
| `estimateSize` | number | 50 | Estimated row height for virtual scrolling |
| `overscan` | number | 10 | Number of items to render outside viewport |

## Hook: useTaskMonitor

The underlying hook that manages task polling and data fetching.

```tsx
import { useTaskMonitor } from '@/hooks/useTaskMonitor'

function MyComponent() {
  const {
    data: tasks,
    isLoading,
    error,
    retry,
    isRecoverable,
    taskCount,
  } = useTaskMonitor({
    pollIntervalMs: 3000,
    statusFilter: 'in-progress',
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Monitoring {taskCount} tasks</h2>
      {isRecoverable && (
        <button onClick={retry}>Retry</button>
      )}
      <ul>
        {tasks.map(task => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Hook Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pollIntervalMs` | number | 5000 | Polling interval in milliseconds |
| `statusFilter` | TaskStatus \| null | null | Filter by status |
| `teamFilter` | string \| null | null | Filter by team |
| `assigneeFilter` | string \| null | null | Filter by assignee |
| `enabled` | boolean | true | Enable/disable polling |

### Hook Return

| Property | Type | Description |
|----------|------|-------------|
| `data` | Task[] | Array of tasks |
| `isLoading` | boolean | Whether data is currently loading |
| `error` | Error \| null | Error object if query failed |
| `retry` | function | Manual retry function |
| `retryCount` | number | Number of failed retry attempts |
| `isRecoverable` | boolean | Whether the error can be retried |
| `taskCount` | number | Number of tasks in the result set |

## API Endpoints

### GET /api/task-monitor

Real-time task monitoring endpoint.

**Query Parameters:**
- `status` - Filter by task status
- `team` - Filter by team
- `assignee` - Filter by assignee

**Response:**

```json
[
  {
    "id": "task-1",
    "title": "Implement feature X",
    "status": "in-progress",
    "priority": "high",
    "assignee": "john",
    "team": "frontend",
    "storyPoints": 5,
    "sprint": "sprint-1",
    "createdAt": "2026-03-06T10:00:00Z",
    "updatedAt": "2026-03-06T11:30:00Z"
  }
]
```

## Usage Examples

### Basic Monitoring

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function MonitoringPage() {
  return (
    <div className="p-6">
      <TaskMonitoringDashboard pollIntervalMs={5000} />
    </div>
  )
}
```

### Filtered Monitoring

```tsx
export function TeamMonitoringPage() {
  return (
    <TaskMonitoringDashboard
      pollIntervalMs={3000}
      teamFilter="backend"
      statusFilter="in-progress"
    />
  )
}
```

### Custom Hook Integration

```tsx
import { useTaskMonitor } from '@/hooks/useTaskMonitor'

export function CustomMonitor() {
  const { data: tasks, isLoading, error, retry, isRecoverable } = useTaskMonitor({
    pollIntervalMs: 2000,
    statusFilter: 'in-review',
  })

  return (
    <div>
      {error && isRecoverable && (
        <button onClick={retry}>Retry</button>
      )}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task.id}>{task.title} - {task.status}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

## Performance Characteristics

### Virtual Scrolling Optimization

- Renders only visible rows (typically 10-15 rows)
- ~500+ tasks can be displayed without lag
- Estimated row height: 50px (configurable)
- Overscan: 10 items for smooth scrolling

### Polling Optimization

- Configurable poll intervals (default: 5 seconds)
- Smart retry with exponential backoff (1s → 30s)
- Stale-while-revalidate caching strategy
- Prevents unnecessary re-renders

### Memory Usage

Monitoring 1000 tasks with optimal settings:
- Dashboard component: ~2-3MB
- Virtual scrolling: O(visible_rows) memory
- Query cache: ~500KB for task data

## Accessibility

- Semantic HTML (table structure with ARIA roles)
- Keyboard navigation support
- Accessible color contrast
- Column header sorting with ARIA sort indicators
- Loading and error states properly announced

## Testing

See test files in `__tests__/` for comprehensive examples:
- Unit tests for `useTaskMonitor` hook
- Component rendering tests
- Virtual scrolling performance tests
- Error handling scenarios

## Related Documentation

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
