# Conflict Resolution Architecture

## Overview

This document describes the conflict detection and resolution infrastructure implemented for real-time collaborative editing in the AI Dev Team Simulation. As the application uses 30-second polling alongside manual edits, concurrent edit conflicts are inevitable. This system provides automatic detection and user-friendly recovery.

## Key Concepts

### Version Control

Every mutable entity (Task, Sprint) has a `version` field that increments on successful updates:

```typescript
interface Task {
  id: string
  version: number
  // ... other fields
}

interface Sprint {
  id: string
  version: number
  // ... other fields
}
```

### Conflict Detection

Conflicts are detected when:
1. A PATCH request includes a `version` field that doesn't match the server version
2. The server returns a **409 Conflict** response with the current server version

Example 409 response:
```json
{
  "error": "conflict",
  "serverVersion": {
    "id": "task-1",
    "title": "Updated by another user",
    "version": 3,
    // ... full server state
  }
}
```

## useConflictAwareMutation Hook

The `useConflictAwareMutation` hook provides conflict-aware mutation behavior on top of TanStack Query's `useMutation`.

### Usage

```typescript
import { useConflictAwareMutation } from '@/hooks/useConflictAwareMutation'

function useUpdateTask() {
  const queryClient = useQueryClient()

  return useConflictAwareMutation({
    mutationFn: async ({ id, data, version }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, version }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 409) {
          throw new Error(`409: conflict with serverVersion: ${JSON.stringify(error.serverVersion)}`)
        }
        throw new Error(error.error)
      }

      return response.json()
    },
    queryKeyFn: ({ id }) => ['tasks', id],
    onMutate: async ({ id, data, version }) => {
      // Optimistically update the cache
      const previousData = queryClient.getQueryData(['tasks', id])
      queryClient.setQueryData(['tasks', id], (old) => ({
        ...old,
        ...data,
        version: version + 1,
      }))
      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert on error (including conflict)
      if (context?.previousData) {
        queryClient.setQueryData(['tasks', id], context.previousData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
```

### Hook Return Value

```typescript
interface UseConflictAwareMutationResult<TData, TVariables> {
  // Standard TanStack Query mutation properties
  data: TData | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean

  // Mutation functions
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>

  // Conflict state
  conflictState: ConflictState<TData> | null
}

interface ConflictState<TData> {
  hasConflict: boolean
  localChanges: unknown // Variables sent by the user
  serverVersion: TData | null // Full server entity state
  resolve: (strategy: 'reload' | 'override') => Promise<void>
}
```

### Conflict Resolution Strategies

#### 1. Reload (Accept Server)

Accept the server version and discard local changes:

```typescript
if (mutation.conflictState?.hasConflict) {
  mutation.conflictState.resolve('reload')
}
```

Effects:
- Fetches the latest server data
- Discards pending local changes
- UI reflects server state
- User can re-apply changes if needed

#### 2. Override (Force Push)

Retry with the local changes, forcing them to overwrite server changes:

```typescript
if (mutation.conflictState?.hasConflict) {
  mutation.conflictState.resolve('override')
}
```

Effects:
- Increments retry count
- Applies exponential backoff before retry
- Reattempts the mutation with original variables
- May fail again if another concurrent edit happens

### Conflict Logging

The hook provides a lightweight in-memory conflict log for metrics and analytics:

```typescript
import { getConflictMetrics } from '@/hooks/useConflictAwareMutation'

const metrics = getConflictMetrics()
console.log(`Total conflicts: ${metrics.totalConflicts}`)
console.log(`Reloads: ${metrics.reloadCount}`)
console.log(`Overrides: ${metrics.overrideCount}`)
```

Each conflict entry includes:
- `timestamp`: When the conflict was resolved
- `entityType`: Type of entity (task, sprint, etc.)
- `entityId`: ID of the conflicting entity
- `strategy`: 'reload' or 'override'

## Server Implementation

### MSW Handler Example

```typescript
// In src/mocks/handlers/tasks.ts
http.patch('/api/tasks/:id', async ({ params, request }) => {
  const { id } = params
  const body = await request.json()

  const task = mockTasksData[id]
  if (!task) {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check version for conflict detection
  if (body.version !== undefined) {
    const serverVersion = taskVersionStore[id] || 1

    // Return 409 if versions don't match
    if (body.version !== serverVersion) {
      return HttpResponse.json(
        {
          error: 'conflict',
          serverVersion: { ...task, version: serverVersion },
        },
        { status: 409 }
      )
    }
  }

  // Update and increment version
  const updated = {
    ...task,
    ...body,
    version: (task.version || 1) + 1,
    updatedAt: new Date().toISOString(),
  }

  // Persist version
  taskVersionStore[id] = updated.version

  return HttpResponse.json(updated, {
    headers: { 'X-Resource-Version': String(updated.version) },
  })
})
```

### Response Headers

All GET and PATCH responses include the `X-Resource-Version` header:

```
X-Resource-Version: 3
```

This allows clients to know the current version without parsing the response body.

## UI Conflict Resolution Pattern

A typical UI for handling conflicts:

```typescript
function TaskEditor({ taskId }: { taskId: string }) {
  const { data: task } = useTask(taskId)
  const mutation = useUpdateTask()

  const handleSave = (updatedData) => {
    mutation.mutateAsync({
      id: taskId,
      data: updatedData,
      version: task.version,
    })
  }

  if (mutation.conflictState?.hasConflict) {
    const { serverVersion, localChanges } = mutation.conflictState
    return (
      <ConflictDialog
        serverVersion={serverVersion}
        localChanges={localChanges}
        onReload={() => mutation.conflictState.resolve('reload')}
        onOverride={() => mutation.conflictState.resolve('override')}
      />
    )
  }

  return <TaskForm task={task} onSubmit={handleSave} />
}
```

## Retry Strategy

The hook implements exponential backoff for non-conflict errors:

- Retry 1: 1000ms delay (1s)
- Retry 2: 2000ms delay (2s)
- Retry 3: 4000ms delay (4s)
- Max: 10000ms (10s)

Conflicts are NOT automatically retried; they require explicit user resolution.

## Performance Considerations

### Versioning Overhead

- `version` field adds ~12 bytes per entity
- Version comparison is O(1)
- No additional database queries for conflict detection

### Polling + Mutation Conflict

The 30s polling interval creates potential conflicts:

1. User edits task at 0s
2. User submits at 5s (optimistic update applied)
3. Poll fires at 30s and fetches fresh data
4. If someone else edited between 5s-30s → conflict detected

This is the expected behavior and demonstrates the value of conflict resolution.

### Mitigation Strategies

- **Frequent polling**: Reduce polling interval to 10s for higher consistency
- **Collaborative awareness**: Show who edited what and when
- **Field-level locking**: Lock individual fields during edit, not entire entity
- **Operational transformation**: Complex but allows automatic conflict resolution

## Examples

### Basic Task Update

```typescript
const { mutateAsync, conflictState } = useUpdateTask()

try {
  const updated = await mutateAsync({
    id: 'task-1',
    data: { status: 'done', priority: 'high' },
    version: 2,
  })
  console.log('Task updated:', updated)
} catch (error) {
  if (conflictState?.hasConflict) {
    console.log('Conflict detected')
    console.log('Server has:', conflictState.serverVersion)
    console.log('You tried:', conflictState.localChanges)

    // Ask user to resolve
    const choice = await userDialog.ask('Reload or Override?')
    conflictState.resolve(choice)
  }
}
```

### Sprint Batch Update

```typescript
async function updateMultipleSprints(updates) {
  for (const { sprintId, data, version } of updates) {
    try {
      await useUpdateSprint(sprintId).mutateAsync({
        ...data,
        version,
      })
    } catch (error) {
      // Handle conflict per sprint
      // Could implement auto-reload or batch override
    }
  }
}
```

## Testing

### Simulating Conflicts

The MSW handlers simulate ~5% natural conflict rate to test UI behavior:

```typescript
// In src/mocks/handlers/tasks.ts
if (body.version !== serverVersion && Math.random() < 0.05) {
  // Return 409
}
```

To force a conflict in tests:

```typescript
// Use lower delay or simulated version mismatch
test('resolves conflict with override', async () => {
  const { result } = renderHook(() => useUpdateTask())

  // Cause a conflict by changing version
  act(() => {
    result.current.mutate({
      id: 'task-1',
      data: { status: 'done' },
      version: 1, // Will conflict if server is at version 2
    })
  })

  await waitFor(() => {
    expect(result.current.conflictState).not.toBeNull()
  })

  // Resolve with override
  act(() => {
    result.current.conflictState?.resolve('override')
  })

  // Verify retry happened
  await waitFor(() => {
    expect(result.current.data).toBeDefined()
  })
})
```

## Future Enhancements

1. **Operational Transformation**: Auto-merge non-conflicting changes
2. **Field-level Versioning**: Version individual fields instead of whole entity
3. **Undo/Redo**: Integrate with conflict history
4. **Conflict Notifications**: Alert users when their edits conflict
5. **Automatic Resolution**: Smart merging based on field types
6. **Analytics Dashboard**: Track conflict patterns and resolution strategies
