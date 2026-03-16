# Sprint Lifecycle State Machine Implementation Guide

## Overview

The `useSprintLifecycle` hook provides a type-safe, validated state machine for managing sprint lifecycle transitions. It prevents invalid transitions and enforces business rules like blocking completion of sprints with incomplete tasks.

## Architecture

### State Machine

Sprints follow a linear state progression:
```
planning → active → in-review → completed
```

Each transition is validated both client-side and server-side to prevent invalid states.

### Valid Transitions

| Current State | Valid Transitions |
|---|---|
| `planning` | `active` |
| `active` | `in-review` |
| `in-review` | `completed` |
| `completed` | (none) |

### Validation Rules

1. **Hard Block**: Cannot transition to `completed` if incomplete tasks exist
   - Returns error code: `INCOMPLETE_TASKS`
   - Includes count of incomplete tasks
   - UI must not allow completion

2. **Invalid Transitions**: Any transition outside the defined state machine
   - Returns error code: `INVALID_TRANSITION`
   - Clear message indicating current and requested states

## Hook Implementation

### `useSprintLifecycle(sprintId: string)`

#### Returns

```typescript
{
  mutate: (newState: string) => void
  mutateAsync: (newState: string) => Promise<TransitionResponse>
  isPending: boolean
  error: Error | null
  data: TransitionResponse | undefined
  context: {
    previousDetail: Sprint
    previousLists: Array<[QueryKey, Sprint[]]>
    newState: string
  } | undefined
}
```

#### Usage Example

```typescript
import { useSprintLifecycle, parseTransitionError } from '@/hooks'

function SprintStateButtons({ sprintId, currentStatus }: Props) {
  const { mutate, isPending, error } = useSprintLifecycle(sprintId)

  const handleTransition = (newState: string) => {
    mutate(newState)
  }

  // Parse structured error
  const transitionError = error ? parseTransitionError(error) : null

  if (transitionError?.code === 'INCOMPLETE_TASKS') {
    return (
      <button disabled>
        Can't Complete Sprint
        <span className="text-xs">
          {transitionError.count} incomplete tasks
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={() => handleTransition('in-review')}
      disabled={isPending}
    >
      {isPending ? 'Transitioning...' : 'Move to Review'}
    </button>
  )
}
```

## Features

### Optimistic Updates

The mutation immediately updates the sprint status in the cache before the API responds:

```typescript
// Sprint status updates immediately in UI
const { mutate } = useSprintLifecycle('sprint-1')
mutate('active')  // Status shows 'active' instantly

// On success: Updated with real server data
// On error: Reverted to previous state
```

### Cache Invalidation

On successful transition, the hook automatically invalidates related caches:

```typescript
// Invalidated after successful transition:
// - ['sprints', sprintId, 'metrics']
// - ['sprints', sprintId, 'tasks']
```

This ensures dependent data (metrics, task lists) are refreshed.

### Error Handling

#### Structured Error Parsing

Use `parseTransitionError()` to extract structured error information:

```typescript
const error = parseTransitionError(mutationError)

if (error?.code === 'INCOMPLETE_TASKS') {
  console.log(`Cannot complete: ${error.count} tasks remaining`)
}

if (error?.code === 'INVALID_TRANSITION') {
  console.log(`Invalid: ${error.message}`)
}
```

#### Rollback on Error

The mutation automatically reverts optimistic updates if the API request fails:

```typescript
mutate('active')  // Optimistic: status shows 'active'
// API fails...
// Status reverts to previous state automatically
```

## Server API

### Endpoint: `POST /api/sprints/:id/transition`

#### Request

```typescript
{
  newState: string  // Target state ('active', 'in-review', 'completed')
}
```

#### Success Response (200)

```typescript
{
  success: true,
  sprint: {
    id: string
    status: SprintStatus  // New status
    version: number       // Incremented version
    // ... other sprint fields
  }
}
```

#### Validation Error Response (422)

```typescript
{
  error: {
    code: 'INCOMPLETE_TASKS' | 'INVALID_TRANSITION'
    message: string
    count?: number  // Only for INCOMPLETE_TASKS
  }
}
```

### Scenarios

#### 1. Valid Transition

```typescript
// Request: Active → In Review
POST /api/sprints/sprint-1/transition
{ "newState": "in-review" }

// Response: 200
{
  "success": true,
  "sprint": {
    "id": "sprint-1",
    "status": "in-review",
    "version": 2,
    // ...
  }
}
```

#### 2. Incomplete Tasks Block

```typescript
// Request: In Review → Completed (with 3 incomplete tasks)
POST /api/sprints/sprint-2/transition
{ "newState": "completed" }

// Response: 422
{
  "error": {
    "code": "INCOMPLETE_TASKS",
    "message": "Cannot complete sprint with 3 incomplete tasks",
    "count": 3
  }
}
```

#### 3. Invalid Transition

```typescript
// Request: Completed → Active (not allowed)
POST /api/sprints/sprint-1/transition
{ "newState": "active" }

// Response: 422
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot transition from completed to active"
  }
}
```

## Type Definitions

### TransitionError

```typescript
interface TransitionError {
  code: string  // 'INCOMPLETE_TASKS' | 'INVALID_TRANSITION' | 'UNKNOWN_ERROR'
  message: string
  count?: number  // Only for INCOMPLETE_TASKS
}
```

### TransitionResponse

```typescript
interface TransitionResponse {
  success: boolean
  sprint?: Sprint
  error?: TransitionError
}
```

## Integration Patterns

### Pattern 1: Conditional State Buttons

Display transition buttons based on current state and validation:

```typescript
function SprintActions({ sprint }: Props) {
  const { mutate, isPending, error } = useSprintLifecycle(sprint.id)
  const transitionError = error ? parseTransitionError(error) : null

  const canTransition = !isPending && !transitionError

  if (sprint.status === 'planning') {
    return (
      <button
        onClick={() => mutate('active')}
        disabled={!canTransition}
      >
        Start Sprint
      </button>
    )
  }

  if (sprint.status === 'active') {
    return (
      <button
        onClick={() => mutate('in-review')}
        disabled={!canTransition}
      >
        Move to Review
      </button>
    )
  }

  if (sprint.status === 'in-review') {
    return (
      <>
        <button
          onClick={() => mutate('completed')}
          disabled={transitionError?.code === 'INCOMPLETE_TASKS'}
        >
          Complete Sprint
        </button>
        {transitionError?.code === 'INCOMPLETE_TASKS' && (
          <p className="text-red-600">
            {transitionError.count} tasks must be completed first
          </p>
        )}
      </>
    )
  }

  return <p className="text-gray-500">Sprint completed</p>
}
```

### Pattern 2: Dialog with Confirmation

Confirm state transitions before committing:

```typescript
function TransitionDialog({ sprint, isOpen, onClose }: Props) {
  const { mutate, isPending, error } = useSprintLifecycle(sprint.id)
  const transitionError = error ? parseTransitionError(error) : null

  const [targetState, setTargetState] = useState<string>('')

  const handleConfirm = () => {
    mutate(targetState)
    // Dialog closes on success via onSuccess callback
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <h2>Transition Sprint to {targetState}</h2>

        {transitionError?.code === 'INCOMPLETE_TASKS' && (
          <Alert variant="destructive">
            Cannot complete: {transitionError.count} task(s) remaining
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !!transitionError}
          >
            {isPending ? 'Transitioning...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 3: Error Toast Notification

Show error details in a toast on transition failure:

```typescript
import { useToast } from '@/components/ui/use-toast'

function SprintTransitionButton({ sprintId, newState }: Props) {
  const { toast } = useToast()
  const { mutate, error } = useSprintLifecycle(sprintId)
  const transitionError = error ? parseTransitionError(error) : null

  useEffect(() => {
    if (transitionError) {
      if (transitionError.code === 'INCOMPLETE_TASKS') {
        toast({
          title: 'Cannot Complete Sprint',
          description: `${transitionError.count} task(s) are incomplete`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Transition Failed',
          description: transitionError.message,
          variant: 'destructive',
        })
      }
    }
  }, [transitionError, toast])

  return (
    <button onClick={() => mutate(newState)}>
      Transition to {newState}
    </button>
  )
}
```

## Testing

### Mock Scenarios

The MSW handler includes realistic scenarios:

```typescript
// Valid transition
const response = await fetch('/api/sprints/sprint-1/transition', {
  method: 'POST',
  body: JSON.stringify({ newState: 'active' }),
})
// Status: 200, returns updated sprint

// Incomplete tasks block
const response = await fetch('/api/sprints/sprint-2/transition', {
  method: 'POST',
  body: JSON.stringify({ newState: 'completed' }),
})
// Status: 422, returns { error: { code: 'INCOMPLETE_TASKS', count: 3 } }

// Invalid transition
const response = await fetch('/api/sprints/sprint-1/transition', {
  method: 'POST',
  body: JSON.stringify({ newState: 'active' }),
})
// Status: 422, returns { error: { code: 'INVALID_TRANSITION', ... } }
```

### Query Key Structure

The hook uses the established sprint query key structure:

```typescript
['sprints', sprintId, 'detail']      // Sprint detail cache
['sprints', null, 'list', ...]       // Sprint list cache
['sprints', sprintId, 'metrics']     // Invalidated on transition
['sprints', sprintId, 'tasks']       // Invalidated on transition
```

## Version Compatibility

- **TanStack Query**: v5+
- **React**: 16.8+
- **TypeScript**: 4.7+

## Common Patterns & Anti-Patterns

### ✅ DO

- Use `parseTransitionError()` to safely extract error details
- Handle `INCOMPLETE_TASKS` separately for better UX
- Disable buttons when `isPending` or validation fails
- Invalidate dependent caches automatically
- Show clear error messages for blocked transitions

### ❌ DON'T

- Attempt manual state updates without the hook
- Ignore incomplete tasks validation
- Force transitions without user confirmation
- Handle errors in generic catch-alls
- Manually invalidate unrelated caches

## Troubleshooting

### "Sprint not found in cache"

**Cause**: Sprint detail hasn't been loaded before attempting transition

**Solution**: Fetch sprint detail first using `useSprint()` hook

```typescript
const { data: sprint } = useSprint(sprintId)
const { mutate } = useSprintLifecycle(sprintId)

// Now safe to transition
```

### "Invalid transition" error

**Cause**: Attempting invalid state transition per state machine rules

**Solution**: Check current sprint status and only show valid transition buttons:

```typescript
const getValidNextStates = (currentStatus: SprintStatus) => {
  const transitions: Record<SprintStatus, SprintStatus[]> = {
    planning: ['active'],
    active: ['in-review'],
    'in-review': ['completed'],
    completed: [],
    archived: [],
  }
  return transitions[currentStatus] || []
}
```

### Optimistic update not reverting

**Cause**: Error thrown but cache not properly reverted

**Solution**: Error is stored in window context; ensure `parseTransitionError()` is called:

```typescript
const transitionError = error ? parseTransitionError(error) : null
// Clear error via: window.__sprintTransitionError = null
```
