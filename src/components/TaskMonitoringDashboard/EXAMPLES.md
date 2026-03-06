# Task Monitoring Dashboard - Usage Examples

Complete examples demonstrating various use cases of the Task Monitoring Dashboard.

## 1. Basic Real-time Monitoring

Monitor all tasks with default settings (5-second polling interval).

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Task Monitoring</h1>
        <p className="text-slate-600 mt-2">Real-time view of all active tasks</p>
      </div>

      <TaskMonitoringDashboard />
    </div>
  )
}
```

## 2. Filtered Monitoring (Team-specific)

Monitor tasks for a specific team with adjusted polling.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function FrontendTeamMonitor() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Frontend Team - Task Monitor</h1>

      <TaskMonitoringDashboard
        teamFilter="frontend"
        pollIntervalMs={3000}
      />
    </div>
  )
}
```

## 3. Status-based Monitoring

Monitor only in-progress tasks (active work).

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function ActiveTasksMonitor() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Active Work</h1>
      <p className="text-slate-600 mb-4">Tasks currently in progress</p>

      <TaskMonitoringDashboard
        statusFilter="in-progress"
        pollIntervalMs={2000}
      />
    </div>
  )
}
```

## 4. Assignment-based Monitoring

Monitor tasks assigned to a specific person.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function PersonalTaskMonitor({ userId }: { userId: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>

      <TaskMonitoringDashboard
        assigneeFilter={userId}
        pollIntervalMs={5000}
        estimateSize={45}
      />
    </div>
  )
}
```

## 5. Combined Filters

Monitor tasks with multiple filters applied.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function ReviewQueueMonitor() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Code Review Queue</h1>
      <p className="text-slate-600 mb-4">Backend tasks waiting for review</p>

      <TaskMonitoringDashboard
        teamFilter="backend"
        statusFilter="in-review"
        pollIntervalMs={3000}
      />
    </div>
  )
}
```

## 6. Custom Hook Usage

Direct hook usage for custom dashboard layouts.

```tsx
import { useTaskMonitor } from '@/hooks/useTaskMonitor'
import { MutationErrorAlert } from '@/components/MutationErrorAlert'

export function CustomTaskMonitor() {
  const {
    data: tasks,
    isLoading,
    error,
    retry,
    isRecoverable,
    taskCount,
  } = useTaskMonitor({
    pollIntervalMs: 4000,
    statusFilter: 'in-progress',
  })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks ({taskCount})</h1>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Updating...
          </div>
        )}
      </div>

      <MutationErrorAlert
        error={error as Error}
        canRetry={isRecoverable}
        onRetry={retry}
      />

      {isLoading && tasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{task.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">ID: {task.id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''
                }`}>
                  {task.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                <span>Points: {task.storyPoints}</span>
                <span>Team: {task.team}</span>
                <span>Assignee: {task.assignee}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 7. Conditional Rendering

Dashboard with conditional visibility based on state.

```tsx
import { useState } from 'react'
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function ConditionalMonitor() {
  const [showMonitor, setShowMonitor] = useState(true)
  const [pollInterval, setPollInterval] = useState(5000)

  return (
    <div className="p-6">
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMonitor}
              onChange={(e) => setShowMonitor(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Show Monitor</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Poll Interval: {pollInterval}ms
          </label>
          <input
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={pollInterval}
            onChange={(e) => setPollInterval(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {showMonitor && (
        <TaskMonitoringDashboard pollIntervalMs={pollInterval} />
      )}
    </div>
  )
}
```

## 8. Performance Tuning

Example with optimized virtual scrolling settings for large datasets.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function OptimizedMonitor() {
  return (
    <div className="p-6">
      <TaskMonitoringDashboard
        // Slower polling for better performance
        pollIntervalMs={10000}

        // Optimize virtual scrolling for 1000+ items
        estimateSize={40}  // Smaller row height
        overscan={5}       // Fewer items overscan
      />
    </div>
  )
}
```

## 9. Integration with Other Components

Dashboard within a layout with sidebar navigation.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'

export function MonitoringLayout() {
  const [activeTeam, setActiveTeam] = useState<string | null>(null)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-4">
        <h2 className="font-bold text-lg mb-4">Teams</h2>
        <div className="space-y-2">
          {['frontend', 'backend', 'devops'].map(team => (
            <button
              key={team}
              onClick={() => setActiveTeam(team)}
              className={`w-full text-left px-3 py-2 rounded ${
                activeTeam === team
                  ? 'bg-blue-600'
                  : 'hover:bg-slate-800'
              }`}
            >
              {team.charAt(0).toUpperCase() + team.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">
            {activeTeam ? `${activeTeam} Tasks` : 'All Tasks'}
          </h1>

          <TaskMonitoringDashboard
            teamFilter={activeTeam}
            pollIntervalMs={5000}
          />
        </div>
      </div>
    </div>
  )
}
```

## 10. Real-world Monitoring Dashboard

Complete monitoring dashboard with multiple sections.

```tsx
import { TaskMonitoringDashboard } from '@/components/TaskMonitoringDashboard'
import { useTaskMonitor } from '@/hooks/useTaskMonitor'

export function ComprehensiveMonitoring() {
  const allTasks = useTaskMonitor({ pollIntervalMs: 5000 })
  const inProgressTasks = useTaskMonitor({
    statusFilter: 'in-progress',
    pollIntervalMs: 3000,
  })
  const reviewTasks = useTaskMonitor({
    statusFilter: 'in-review',
    pollIntervalMs: 3000,
  })

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Monitoring Center</h1>
        <p className="text-slate-600 mt-2">Real-time task execution dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-600 text-sm">Total Tasks</p>
          <p className="text-3xl font-bold text-slate-900">
            {allTasks.taskCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-600 text-sm">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">
            {inProgressTasks.taskCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-600 text-sm">In Review</p>
          <p className="text-3xl font-bold text-yellow-600">
            {reviewTasks.taskCount}
          </p>
        </div>
      </div>

      {/* In Progress Tasks */}
      <section>
        <h2 className="text-2xl font-bold mb-4">In Progress Work</h2>
        <TaskMonitoringDashboard
          statusFilter="in-progress"
          pollIntervalMs={3000}
        />
      </section>

      {/* Code Review Queue */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Waiting for Review</h2>
        <TaskMonitoringDashboard
          statusFilter="in-review"
          pollIntervalMs={3000}
        />
      </section>

      {/* All Tasks Overview */}
      <section>
        <h2 className="text-2xl font-bold mb-4">All Tasks</h2>
        <TaskMonitoringDashboard pollIntervalMs={5000} />
      </section>
    </div>
  )
}
```

## Performance Tips

1. **Polling Intervals**: Use longer intervals (5000ms+) for less critical monitoring
2. **Filtering**: Apply status/team filters to reduce data size
3. **Virtual Scrolling**: Adjust `estimateSize` to match your row height
4. **Memory**: Monitor browser DevTools for excessive memory usage
5. **Network**: Use slower polling intervals to reduce API calls

## Troubleshooting

### Dashboard Not Updating
- Check that `enabled` prop is `true`
- Verify polling interval isn't set to `false`
- Check browser console for errors
- Try manual `retry()` function

### Slow Performance
- Reduce overscan value
- Adjust estimateSize to actual row height
- Increase polling interval
- Apply more specific filters

### Memory Issues
- Limit number of tasks shown (use filters)
- Increase garbage collection time
- Check for memory leaks in custom components
