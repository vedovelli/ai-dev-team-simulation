# Sprint Backlog Reorder Hook Implementation Guide

## Overview

The `useSprintReorder` hook provides a mutation for reordering tasks within a sprint backlog. It combines TanStack Query's mutation capabilities with optimistic updates, automatic rollback, and debounced execution to deliver a responsive drag-and-drop experience.

## Features

- **Optimistic Updates**: UI reflects changes immediately without waiting for server confirmation
- **Automatic Rollback**: Reverts to previous state if the mutation fails
- **Debounced Mutations**: Batches rapid drag operations (default 500ms) before sending to server
- **Query Invalidation**: Ensures cache consistency after successful updates
- **Type-Safe**: Full TypeScript support with proper types
- **Error Handling**: Built-in retry and error handling via `useMutationWithRetry`

## Hook Signature

```typescript
useSprintReorder(options?: UseSprintReorderOptions): UseSprintReorderReturn
```

### Options

```typescript
interface UseSprintReorderOptions extends UseMutationOptions<...> {
  debounceMs?: number  // Debounce delay in milliseconds (default: 500)
}
```

### Return Value

```typescript
interface UseSprintReorderReturn {
  mutate: (sprintId: string, taskIds: string[]) => void
  mutateAsync: (sprintId: string, taskIds: string[]) => Promise<ReorderResponse>
  isPending: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}
```

## Usage Examples

### Basic Drag-and-Drop Reordering

```typescript
import { useSprintReorder } from '@/hooks'
import { moveTaskInList } from '@/utils/reorderUtils'

function SprintTaskBoard({ sprintId, tasks }: Props) {
  const { mutate: reorder, isPending } = useSprintReorder()

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    // Calculate new task order after drag
    const newTasks = moveTaskInList(
      tasks,
      result.source.index,
      result.destination.index
    )

    // Send reorder mutation (automatically debounced)
    reorder(sprintId, newTasks.map(t => t.id))
  }

  return (
    <div className={isPending ? 'opacity-50' : ''}>
      {/* Render draggable task list */}
    </div>
  )
}
```

### Keyboard Navigation Reordering

```typescript
function TaskList({ sprintId, tasks }: Props) {
  const { mutate: reorder } = useSprintReorder()

  const handleKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === 'ArrowUp' && index > 0) {
      const newTasks = moveTaskInList(tasks, index, index - 1)
      reorder(sprintId, newTasks.map(t => t.id))
    } else if (event.key === 'ArrowDown' && index < tasks.length - 1) {
      const newTasks = moveTaskInList(tasks, index, index + 1)
      reorder(sprintId, newTasks.map(t => t.id))
    }
  }

  // Render tasks with keyboard handlers
}
```

### Custom Debounce Configuration

```typescript
const { mutate: reorder } = useSprintReorder({
  debounceMs: 1000, // Wait 1 second before sending
  onError: (error) => {
    showErrorToast(`Failed to reorder: ${error.message}`)
  },
})
```

### Loading State Management

```typescript
function SprintBacklog({ sprintId, tasks }: Props) {
  const {
    mutate: reorder,
    isPending,
    isError,
    error,
  } = useSprintReorder()

  if (isError) {
    return (
      <div className="error-banner">
        <p>Failed to reorder tasks: {error?.message}</p>
        <button onClick={reset}>Dismiss</button>
      </div>
    )
  }

  return (
    <div className={isPending ? 'is-reordering' : ''}>
      {/* Task list */}
    </div>
  )
}
```

## Helper Utilities

### `moveTaskInList(tasks, fromIndex, toIndex)`

Pure function to reorder items in an array. Useful for keyboard navigation and testing.

```typescript
import { moveTaskInList } from '@/utils/reorderUtils'

const tasks = [taskA, taskB, taskC, taskD]
const reordered = moveTaskInList(tasks, 0, 2)
// Result: [taskB, taskC, taskA, taskD]
```

**Features:**
- Pure function (no side effects)
- Safe with invalid indices (returns original array)
- Easy to test and debug
- Works with any array type

## API Endpoint

### PATCH `/api/sprints/:id/tasks/reorder`

**Request Body:**
```json
{
  "taskIds": ["task-1", "task-3", "task-2"]
}
```

**Response (Success):**
```json
{
  "success": true,
  "sprintId": "sprint-1",
  "taskIds": ["task-1", "task-3", "task-2"],
  "message": "Tasks reordered successfully"
}
```

**Response (Error):**
```json
{
  "error": "Invalid task IDs for this sprint: task-99"
}
```

## Implementation Details

### Optimistic Update Flow

1. **Cancel Pending Queries**: Prevents race conditions
2. **Snapshot Current State**: Save original task order
3. **Apply Optimistically**: Update local cache immediately
4. **Send Mutation**: Debounced request to server
5. **On Success**: Invalidate query (refetch if needed)
6. **On Error**: Rollback to snapshotted state

### Debounce Mechanism

The hook uses `useRef` and `setTimeout` to implement debouncing:
- Rapid mutations within the debounce window batch together
- Only the final mutation is sent to the server
- Reduces network traffic during fast drag operations
- Configurable via `debounceMs` option

### Query Invalidation

After successful reorder:
```typescript
queryClient.invalidateQueries({
  queryKey: ['sprints', sprintId, 'tasks'],
})
```

This triggers a refetch of the sprint's task list to ensure cache consistency.

## Testing

### Unit Tests

```typescript
import { moveTaskInList } from '@/utils/reorderUtils'

describe('moveTaskInList', () => {
  it('moves item from index 0 to index 2', () => {
    const items = [1, 2, 3, 4]
    const result = moveTaskInList(items, 0, 2)
    expect(result).toEqual([2, 3, 1, 4])
  })

  it('returns original array for invalid indices', () => {
    const items = [1, 2, 3]
    expect(moveTaskInList(items, -1, 1)).toEqual(items)
    expect(moveTaskInList(items, 0, 5)).toEqual(items)
    expect(moveTaskInList(items, 0, 0)).toEqual(items)
  })
})
```

### Integration Tests

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSprintReorder } from '@/hooks'

describe('useSprintReorder', () => {
  it('debounces mutations', async () => {
    const { result } = renderHook(() => useSprintReorder({ debounceMs: 100 }))

    act(() => {
      result.current.mutate('sprint-1', ['task-1', 'task-2'])
      result.current.mutate('sprint-1', ['task-2', 'task-1'])
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))
    // Only one mutation should be sent
  })
})
```

## Best Practices

1. **Always provide task IDs**: Ensure all sprint tasks are included in the reorder payload
2. **Handle errors gracefully**: Show toast or error message to users
3. **Use optimistic updates**: Don't disable them; they improve UX
4. **Debounce aggressively**: Default 500ms works for most cases
5. **Clear debounce on unmount**: Hook automatically handles cleanup
6. **Combine with move utility**: Use `moveTaskInList()` to calculate new positions

## Troubleshooting

### Debounce Not Working

Ensure you're using the `mutate` function (not `mutateAsync`) to trigger debounced behavior.

```typescript
// ✅ Correct - uses debounce
reorder(sprintId, newTaskIds)

// ❌ Wrong - sends immediately
await reorderAsync(sprintId, newTaskIds)
```

### State Not Updating Immediately

Confirm that the query key in your component matches the optimistic update key:

```typescript
// Hook uses: ['sprints', sprintId, 'tasks']
// Your query should use the same key
const { data: tasks } = useQuery({
  queryKey: ['sprints', sprintId, 'tasks'],
  queryFn: () => fetchSprintTasks(sprintId),
})
```

### Rollback Not Working

Check that `onMutate` successfully snapshots the previous state:

```typescript
// Verify in React DevTools that previousTasks is captured
onMutate: ({ sprintId }) => {
  const previousTasks = queryClient.getQueryData([...])
  console.log('Snapshots:', previousTasks) // Should not be undefined
}
```

## Related Features

- **useTaskAssignment**: Move tasks between agents
- **useBulkUpdateTasks**: Update multiple task properties
- **moveTaskInList**: Pure reordering utility
- **SprintTaskTable**: UI component that displays sprint tasks
