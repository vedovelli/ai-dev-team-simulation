# Task Dependencies Implementation Guide (FAB-202)

## Overview

This guide documents the complete implementation of task dependencies and blocking chains in the AI Dev Team Simulation. The system prevents tasks with unmet dependencies from being marked complete and handles transitive blocking relationships.

## Core Concepts

### Direct Dependencies
Task A "depends on" Task B means Task B must be completed before Task A can be marked complete.

```
Task B (dependency) → Task A (dependent)
```

### Blocking Relationships
Task A "blocks" Task B means Task B depends on Task A. This is the inverse relationship.

```
Task A (blocker) ← Task B (blocked)
```

### Transitive Blocking
If Task A blocks Task B, and Task B blocks Task C, then Task A transitively blocks Task C.

```
Task A → Task B → Task C
```

When Task A is incomplete, Task C is indirectly blocked even though there's no direct dependency link.

## Data Model

### Task Type Extensions

```typescript
export interface Task {
  // ... existing fields

  // Array of task IDs that this task depends on
  dependsOn?: string[]

  // Computed field: array of task IDs that block this task
  blockedBy?: string[]
}
```

### Dependency Response Types

```typescript
export interface BlockingStatus {
  isBlocked: boolean
  blockedDependencies: Array<{ id: string; title: string; status: string }>
  transitivelyBlockedCount: number
}

export interface TaskDependenciesResponse {
  taskId: string
  dependencies: Task[]
  blockers: Task[]
  isBlocked: boolean
  blockingStatus: BlockingStatus
}
```

## API Endpoints

### GET /api/tasks/:id/dependencies

Fetch the full dependency chain and blocking status for a task.

**Response:**
```json
{
  "taskId": "task-3",
  "dependencies": [
    {
      "id": "task-1",
      "title": "Setup database schema",
      "status": "done",
      // ... other task fields
    },
    {
      "id": "task-2",
      "title": "Create API endpoints",
      "status": "in-progress",
      // ... other task fields
    }
  ],
  "blockers": [
    {
      "id": "task-4",
      "title": "Frontend integration",
      "status": "backlog",
      // ... other task fields
    }
  ],
  "isBlocked": true,
  "blockingStatus": {
    "isBlocked": true,
    "blockedDependencies": [
      { "id": "task-2", "title": "Create API endpoints", "status": "in-progress" }
    ],
    "transitivelyBlockedCount": 2
  }
}
```

### POST /api/tasks/:id/dependencies

Add a new dependency relationship (Task A depends on Task B).

**Request:**
```json
{
  "dependsOnTaskId": "task-2"
}
```

**Features:**
- Circular dependency detection and prevention
- Validates that dependency task exists
- Returns updated task with dependency list

### DELETE /api/tasks/:id/dependencies/:depId

Remove a dependency relationship.

**Response:** Updated task with removed dependency.

### PATCH /api/tasks/:id/blocking-status

Update blocking relationship status and validate constraints.

**Features:**
- Validates that blocked tasks cannot be marked complete
- Returns current blocking status with blocked dependencies
- Used for checking if a task can be transitioned to "done" status

## React Hooks API

### useTaskDependencies(taskId: string)

Query hook to fetch dependencies and blocking status for a task.

**Configuration:**
- Query key: `['tasks', taskId, 'dependencies']`
- Stale time: 30 seconds
- GC time: 2 minutes
- Retry: 3 attempts with exponential backoff

**Returns:**
```typescript
{
  data: {
    taskId: string
    dependencies: Task[]
    blockers: Task[]
    isBlocked: boolean
    blockingStatus: BlockingStatus
  }
  isLoading: boolean
  error: Error | null
}
```

**Example:**
```tsx
function TaskDependencyPanel({ taskId }) {
  const { data, isLoading, error } = useTaskDependencies(taskId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const { isBlocked, blockedDependencies, transitivelyBlockedCount } = data.blockingStatus

  return (
    <div>
      {isBlocked && (
        <div className="alert alert-warning">
          <h3>Task is Blocked</h3>
          <p>Complete the following dependencies first:</p>
          <ul>
            {blockedDependencies.map((dep) => (
              <li key={dep.id}>
                {dep.title} ({dep.status})
              </li>
            ))}
          </ul>
          {transitivelyBlockedCount > 0 && (
            <p>Plus {transitivelyBlockedCount} transitively blocked tasks</p>
          )}
        </div>
      )}
    </div>
  )
}
```

### useDependencyMutations()

Mutation hook for managing task dependencies.

**Returns:**
```typescript
{
  addDependency: (variables: DependencyVariables, options?) => void
  removeDependency: (variables: DependencyVariables, options?) => void
  addDependencyAsync: (variables: DependencyVariables) => Promise<Task>
  removeDependencyAsync: (variables: DependencyVariables) => Promise<Task>
  updateBlockingStatus: (taskId: string, options?) => void
  updateBlockingStatusAsync: (taskId: string) => Promise<BlockingStatus>
  isPending: boolean
}
```

**Example - Adding a Dependency:**
```tsx
function TaskDependencyForm({ taskId, availableTasks }) {
  const { addDependency, isPending } = useDependencyMutations()
  const [selectedDepId, setSelectedDepId] = useState('')

  const handleAdd = () => {
    addDependency(
      { taskId, dependsOnTaskId: selectedDepId },
      {
        onSuccess: () => {
          setSelectedDepId('')
          showNotification('Dependency added')
        },
        onError: (error) => {
          showError(error.message)
        },
      }
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleAdd() }}>
      <select value={selectedDepId} onChange={(e) => setSelectedDepId(e.target.value)}>
        <option value="">Select a dependency...</option>
        {availableTasks
          .filter((t) => t.id !== taskId)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
      </select>
      <button type="submit" disabled={isPending || !selectedDepId}>
        Add Dependency
      </button>
    </form>
  )
}
```

**Example - Validating Before Completing:**
```tsx
function CompleteTaskButton({ taskId }) {
  const { data: deps } = useTaskDependencies(taskId)
  const completeTaskMutation = useCompleteTask()

  const handleComplete = () => {
    if (deps?.isBlocked) {
      showError('Cannot complete: task has incomplete dependencies')
      return
    }
    completeTaskMutation.mutate(taskId)
  }

  return (
    <button
      onClick={handleComplete}
      disabled={deps?.isBlocked}
      title={deps?.isBlocked ? 'Complete dependencies first' : ''}
    >
      Mark Complete
    </button>
  )
}
```

## Cache Invalidation Strategy

When a task's status changes, all dependent tasks' dependency queries are invalidated:

```typescript
// When task-2 is marked complete:
// 1. Invalidate ['tasks', 'task-2', 'dependencies']
// 2. Find all tasks with dependsOn: ['task-2']
// 3. Invalidate their dependency queries:
//    - ['tasks', 'task-3', 'dependencies']
//    - ['tasks', 'task-4', 'dependencies']
//    - etc.
```

This ensures blocking status is recalculated transitively when parent tasks change.

## Transitive Blocking Algorithm

The implementation uses a breadth-first search to compute transitive blocking:

```typescript
function getTransitiveBlockedTasks(taskId: string): string[] {
  const blocked = new Set<string>()
  const queue = [taskId]

  while (queue.length > 0) {
    const current = queue.shift()!
    // Find all tasks that depend on current
    const blockedByThis = findTasksDependingOn(current)

    for (const id of blockedByThis) {
      const task = getTask(id)
      // Only add if blocker is incomplete and not already processed
      if (task.status !== 'done' && !blocked.has(id)) {
        blocked.add(id)
        queue.push(id) // Continue search from this task
      }
    }
  }

  return Array.from(blocked)
}
```

**Example:**
```
Task A (in-progress)
  ↓ blocks
Task B (backlog)
  ↓ blocks
Task C (backlog)
  ↓ blocks
Task D (backlog)

getTransitiveBlockedTasks('task-a') returns ['task-b', 'task-c', 'task-d']
```

If Task C becomes done but Task B is still incomplete:
```
getTransitiveBlockedTasks('task-a') returns ['task-b', 'task-c']
```

Task D is no longer in the blocked set because its direct blocker (Task C) is done.

## Validation Rules

### 1. Cannot Mark Blocked Tasks Complete

A task cannot transition to "done" status if it has incomplete dependencies:

```typescript
// This returns a 400 error
PATCH /api/tasks/task-3/blocking-status
// If task-3 depends on task-2 and task-2 is in-progress
```

Implementation in `useCompleteTask` mutation:
```typescript
const handleComplete = async (taskId: string) => {
  const depData = queryClient.getQueryData(['tasks', taskId, 'dependencies'])
  if (depData?.isBlocked) {
    throw new Error('Cannot complete blocked task')
  }
  // Proceed with completion
}
```

### 2. Circular Dependency Detection

Adding a dependency validates no circular chains are created:

```typescript
// Not allowed: would create A → B → A
POST /api/tasks/task-a/dependencies
{ "dependsOnTaskId": "task-b" }
// If task-b already depends on task-a (directly or transitively)
```

## MSW Mock Handler

The MSW handler provides realistic simulation:

```typescript
// task-1 (done) → task-2 (in-progress) → task-3 (backlog)

// GET /api/tasks/task-3/dependencies
// Returns: isBlocked = true, blockedDependencies = [task-2]

// GET /api/tasks/task-2/dependencies
// Returns: isBlocked = true, blockedDependencies = [task-1]

// GET /api/tasks/task-1/dependencies
// Returns: isBlocked = false, blockedDependencies = []
```

## Query Key Pattern

Following TanStack Query best practices:

```typescript
const dependencyKeys = {
  all: ['tasks'],
  dependencies: () => ['tasks', 'dependencies'],
  detail: (taskId: string) => ['tasks', taskId, 'dependencies'],
}

// Invalidate single task
queryClient.invalidateQueries({ queryKey: dependencyKeys.detail('task-3') })

// Invalidate all dependency queries
queryClient.invalidateQueries({ queryKey: dependencyKeys.dependencies() })
```

## Integration Points

### Task List / Table
Display blocking status badges:
```tsx
function TaskTableRow({ task }) {
  const { data: deps } = useTaskDependencies(task.id)

  return (
    <tr>
      <td>{task.title}</td>
      <td>{task.status}</td>
      {deps?.isBlocked && (
        <td className="blocked-badge">⛔ Blocked</td>
      )}
    </tr>
  )
}
```

### Task Detail Modal
Show dependency chains and validation:
```tsx
function TaskDetailDependencies({ taskId }) {
  const { data, isLoading } = useTaskDependencies(taskId)
  const completeTaskMut = useCompleteTask()

  return (
    <>
      {data?.isBlocked && (
        <BlockedAlert dependencies={data.blockingStatus.blockedDependencies} />
      )}
      <DependencyList dependencies={data.dependencies} />
      <BlockerList blockers={data.blockers} />
      <CompleteButton
        disabled={data?.isBlocked}
        onClick={() => completeTaskMut.mutate(taskId)}
      />
    </>
  )
}
```

### Sprint Board
Filter view by blocking status:
```tsx
function SprintBoard({ sprintId }) {
  const { data: tasks } = useSprintTasks(sprintId)

  const blockedTasks = tasks?.filter(t => {
    const { data: deps } = useTaskDependencies(t.id)
    return deps?.isBlocked
  })

  return (
    <>
      <Column title="Blocked" tasks={blockedTasks} />
      <Column title="Ready" tasks={readyTasks} />
      <Column title="In Progress" tasks={inProgressTasks} />
    </>
  )
}
```

## Testing

### Example Test Cases

```typescript
describe('useTaskDependencies', () => {
  it('should return blocking status when task has incomplete dependencies', async () => {
    const { result } = renderHook(() => useTaskDependencies('task-3'))

    await waitFor(() => {
      expect(result.current.data?.isBlocked).toBe(true)
      expect(result.current.data?.blockingStatus.blockedDependencies).toHaveLength(1)
    })
  })

  it('should compute transitive blocking correctly', async () => {
    // task-1 → task-2 → task-3
    const { result } = renderHook(() => useTaskDependencies('task-1'))

    await waitFor(() => {
      expect(result.current.data?.blockingStatus.transitivelyBlockedCount).toBe(2)
    })
  })

  it('should prevent adding circular dependencies', async () => {
    const { result } = renderHook(() => useDependencyMutations())

    result.current.addDependency({
      taskId: 'task-a',
      dependsOnTaskId: 'task-b'
    })

    await waitFor(() => {
      expect(result.current.error?.message).toContain('circular')
    })
  })
})
```

## Performance Considerations

1. **Query stale time (30s)**: Dependency relationships don't change frequently, so stale-while-revalidate works well
2. **GC time (2min)**: Keep in memory for 2 minutes to avoid refetching on back/forward navigation
3. **Transitive blocking cache**: Computed on-demand via BFS, complexity is O(n) where n is tasks in dependency graph
4. **Selective invalidation**: Only invalidate affected tasks' queries, not the entire cache

## Related Features

- **Task Status Updates**: When a task's status changes, dependent tasks' blocking status may change
- **Sprint Planning**: Cannot move tasks with incomplete dependencies to earlier sprints
- **Task Assignment**: May want to assign tasks in dependency order for efficiency
- **Notifications**: Notify assignees when their blockers are completed

## Summary

The task dependencies system provides:
- ✅ Transitive blocking for complex dependency chains
- ✅ Validation to prevent completing blocked tasks
- ✅ Circular dependency detection
- ✅ Smart cache invalidation
- ✅ Rich blocking status information
- ✅ Full TanStack Query integration with proper query keys
