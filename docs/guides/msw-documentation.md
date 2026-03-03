# Mock Service Worker (MSW) Documentation

## Overview

Mock Service Worker is used in development and testing to intercept API requests and return mock responses. This allows frontend development to proceed independently of backend availability.

## Handler Structure

MSW handlers are defined in `src/mocks/handlers.ts` and organized by resource type:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Task handlers
  http.get('/api/tasks', handleGetTasks),
  http.post('/api/tasks', handleCreateTask),
  http.patch('/api/tasks/:taskId', handleUpdateTask),
  http.delete('/api/tasks/:taskId', handleDeleteTask),

  // Agent handlers
  http.get('/api/agents', handleGetAgents),
  http.post('/api/agents', handleCreateAgent),
  // ...
]
```

## Handler Patterns

### GET Request Handler

```typescript
/**
 * Handler for fetching a list of resources with optional filtering
 */
const handleGetTasks = async (info: HttpRequestResolverInfo) => {
  const url = new URL(info.request.url)
  const status = url.searchParams.get('status')
  const priority = url.searchParams.get('priority')
  const team = url.searchParams.get('team')

  // Filter mock data based on parameters
  let filteredTasks = mockTasks

  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status)
  }
  if (priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === priority)
  }
  if (team) {
    filteredTasks = filteredTasks.filter(task => task.team === team)
  }

  return HttpResponse.json({
    data: filteredTasks,
    total: filteredTasks.length,
    pageIndex: 0,
    pageSize: 100,
  })
}

// Register handler
http.get('/api/tasks', handleGetTasks)
```

### GET Single Item Handler

```typescript
const handleGetTask = (info: HttpRequestResolverInfo) => {
  const { taskId } = info.params

  const task = mockTasks.find(t => t.id === taskId)

  if (!task) {
    return HttpResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    )
  }

  return HttpResponse.json(task)
}

// Register handler
http.get('/api/tasks/:taskId', handleGetTask)
```

### POST Request Handler

```typescript
/**
 * Handler for creating a new resource
 */
const handleCreateTask = async (info: HttpRequestResolverInfo) => {
  // Parse request body
  const body = await info.request.json() as CreateTaskPayload

  // Validate required fields
  if (!body.title || !body.status) {
    return HttpResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Create mock response with generated ID
  const newTask = {
    id: `task-${Date.now()}`,
    title: body.title,
    status: body.status,
    priority: body.priority || 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Add to mock data (simulate persistence)
  mockTasks.push(newTask)

  return HttpResponse.json(newTask, { status: 201 })
}

// Register handler
http.post('/api/tasks', handleCreateTask)
```

### PATCH Request Handler

```typescript
/**
 * Handler for updating an existing resource
 */
const handleUpdateTask = async (info: HttpRequestResolverInfo) => {
  const { taskId } = info.params
  const body = await info.request.json() as Partial<Task>

  const taskIndex = mockTasks.findIndex(t => t.id === taskId)

  if (taskIndex === -1) {
    return HttpResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    )
  }

  // Update task with new values
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...body,
    updatedAt: new Date().toISOString(),
  }

  return HttpResponse.json(mockTasks[taskIndex])
}

// Register handler
http.patch('/api/tasks/:taskId', handleUpdateTask)
```

### DELETE Request Handler

```typescript
/**
 * Handler for deleting a resource
 */
const handleDeleteTask = (info: HttpRequestResolverInfo) => {
  const { taskId } = info.params

  const taskIndex = mockTasks.findIndex(t => t.id === taskId)

  if (taskIndex === -1) {
    return HttpResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    )
  }

  // Remove from mock data
  const deletedTask = mockTasks.splice(taskIndex, 1)[0]

  return HttpResponse.json(deletedTask)
}

// Register handler
http.delete('/api/tasks/:taskId', handleDeleteTask)
```

## Simulating API Delays

Add realistic network latency for testing loading states:

```typescript
import { delay, http, HttpResponse } from 'msw'

const handleGetTasks = async (info: HttpRequestResolverInfo) => {
  // Simulate 500ms network delay
  await delay(500)

  return HttpResponse.json({
    data: mockTasks,
    total: mockTasks.length,
  })
}
```

## Simulating Errors

Test error handling by returning error responses:

```typescript
/**
 * Handler that sometimes fails (useful for error UI testing)
 */
let callCount = 0
const handleGetTasksWithErrors = (info: HttpRequestResolverInfo) => {
  callCount++

  // Fail first request, succeed on second
  if (callCount === 1) {
    return HttpResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }

  return HttpResponse.json({ data: mockTasks })
}

// Or always fail
const handleFailingRequest = (info: HttpRequestResolverInfo) => {
  return HttpResponse.json(
    { error: 'Authentication failed' },
    { status: 401 }
  )
}
```

## Conditional Handlers

Respond differently based on request content:

```typescript
const handleCreateTaskConditional = async (info: HttpRequestResolverInfo) => {
  const body = await info.request.json() as CreateTaskPayload

  // Return 400 if title is too short
  if (body.title && body.title.length < 3) {
    return HttpResponse.json(
      { error: 'Title must be at least 3 characters' },
      { status: 400 }
    )
  }

  // Return 409 if task with same title exists
  if (mockTasks.some(t => t.title === body.title)) {
    return HttpResponse.json(
      { error: 'Task with this title already exists' },
      { status: 409 }
    )
  }

  // Success case
  const newTask = { id: `task-${Date.now()}`, ...body }
  mockTasks.push(newTask)
  return HttpResponse.json(newTask, { status: 201 })
}
```

## Mock Data Management

### Organizing Mock Data

```typescript
// Separate file: src/mocks/mockData.ts
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Setup React Query',
    status: 'done',
    priority: 'high',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-02T14:00:00Z',
  },
  // ... more tasks
]

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Alice',
    role: 'frontend',
    status: 'active',
  },
  // ... more agents
]
```

### Resetting Mock Data Between Tests

```typescript
// In test setup
beforeEach(() => {
  // Reset to original state
  mockTasks.length = 0
  mockTasks.push(...structuredClone(ORIGINAL_MOCK_TASKS))
})
```

## Adding New Endpoints

### Step 1: Define Request/Response Types

```typescript
// In src/types/task.ts
export interface CreateTaskPayload {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  teamId: string
  sprintId?: string
}
```

### Step 2: Create Handler

```typescript
// In src/mocks/handlers.ts
const handleCreateTask = async (info: HttpRequestResolverInfo) => {
  const body = await info.request.json() as CreateTaskPayload

  // Validation
  if (!body.title) {
    return HttpResponse.json(
      { error: 'Title is required' },
      { status: 400 }
    )
  }

  // Create and return
  const newTask: Task = {
    id: `task-${Date.now()}`,
    ...body,
    createdAt: new Date().toISOString(),
  }

  mockTasks.push(newTask)
  return HttpResponse.json(newTask, { status: 201 })
}
```

### Step 3: Register Handler

```typescript
// In handlers array
export const handlers = [
  http.post('/api/tasks', handleCreateTask),
  // ... other handlers
]
```

### Step 4: Test in Frontend

Now use the new endpoint in components:

```typescript
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newTask),
})
```

## Testing Patterns with MSW

### Testing Loading States

```typescript
// handler with delay
http.get('/api/tasks', async () => {
  await delay(1000)
  return HttpResponse.json({ data: mockTasks })
})

// In test
it('shows loading state while fetching', async () => {
  const { getByText } = render(<TaskList />)
  expect(getByText('Loading...')).toBeInTheDocument()

  await waitFor(() => {
    expect(getByText('Task 1')).toBeInTheDocument()
  })
})
```

### Testing Error States

```typescript
// handler that fails
http.get('/api/tasks', () => {
  return HttpResponse.json(
    { error: 'Server error' },
    { status: 500 }
  )
})

// In test
it('shows error message on failure', async () => {
  const { getByText } = render(<TaskList />)

  await waitFor(() => {
    expect(getByText(/error/i)).toBeInTheDocument()
  })
})
```

### Testing Form Submission

```typescript
// handler validates input
http.post('/api/tasks', async (info) => {
  const body = await info.request.json() as CreateTaskPayload

  if (!body.title) {
    return HttpResponse.json(
      { error: 'Title required' },
      { status: 400 }
    )
  }

  return HttpResponse.json({ id: 'task-1', ...body }, { status: 201 })
})

// In test
it('shows validation error on submit', async () => {
  const { getByRole, getByText } = render(<CreateTaskForm />)

  fireEvent.click(getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(getByText('Title required')).toBeInTheDocument()
  })
})
```

## Best Practices

### 1. Keep Mock Data Realistic

```typescript
// ✅ Good: Realistic mock data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Setup authentication',
    status: 'done',
    priority: 'high',
    assignee: 'alice@company.com',
    createdAt: new Date(2026, 2, 1).toISOString(),
    dueDate: new Date(2026, 2, 5).toISOString(),
  },
]

// ❌ Avoid: Incomplete or overly simple data
const mockTasks = [
  { id: 'task-1', title: 'Task' }
]
```

### 2. Validate Input in Handlers

```typescript
// ✅ Good: Validate request data
const handleCreateTask = async (info) => {
  const body = await info.request.json()

  if (!body.title) {
    return HttpResponse.json({ error: 'Title required' }, { status: 400 })
  }
  if (body.title.length < 3) {
    return HttpResponse.json({ error: 'Title too short' }, { status: 400 })
  }

  // ...
}
```

### 3. Generate Realistic IDs

```typescript
// ✅ Good: Realistic resource IDs
const newTask = {
  id: `task-${Date.now()}`,  // or uuid()
  // ...
}

// ❌ Avoid: Generic IDs
const newTask = {
  id: 'task-1',  // Same every time
  // ...
}
```

### 4. Include All Required Fields

```typescript
// ✅ Good: Complete response
return HttpResponse.json({
  id: 'task-1',
  title: 'Task',
  status: 'backlog',
  priority: 'medium',
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
})

// ❌ Avoid: Missing fields that frontend expects
return HttpResponse.json({
  id: 'task-1',
  title: 'Task',
})
```

### 5. Simulate Realistic Delays

```typescript
// ✅ Good: Reasonable latency
await delay(200)  // 200ms typical network latency

// ❌ Avoid: No latency (hides real loading issues)
// or excessive latency that slows down development
await delay(5000)  // Too long
```

## Common Patterns

### Pattern 1: Paginated Response

```typescript
const handleGetTasks = (info: HttpRequestResolverInfo) => {
  const url = new URL(info.request.url)
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = Number(url.searchParams.get('pageSize')) || 10

  const start = page * pageSize
  const end = start + pageSize
  const paginatedTasks = mockTasks.slice(start, end)

  return HttpResponse.json({
    data: paginatedTasks,
    total: mockTasks.length,
    page,
    pageSize,
    pageCount: Math.ceil(mockTasks.length / pageSize),
  })
}
```

### Pattern 2: Search/Filter Response

```typescript
const handleSearchTasks = (info: HttpRequestResolverInfo) => {
  const url = new URL(info.request.url)
  const query = url.searchParams.get('q') || ''
  const status = url.searchParams.get('status')

  let results = mockTasks

  if (query) {
    results = results.filter(t =>
      t.title.toLowerCase().includes(query.toLowerCase())
    )
  }

  if (status) {
    results = results.filter(t => t.status === status)
  }

  return HttpResponse.json({ data: results, total: results.length })
}
```

### Pattern 3: Nested Resource

```typescript
const handleGetTaskComments = (info: HttpRequestResolverInfo) => {
  const { taskId } = info.params

  const task = mockTasks.find(t => t.id === taskId)
  if (!task) {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const comments = mockComments.filter(c => c.taskId === taskId)
  return HttpResponse.json({ data: comments, taskId })
}

// Register with nested path
http.get('/api/tasks/:taskId/comments', handleGetTaskComments)
```

## Debugging MSW

### Enable MSW Logging

```typescript
// In src/mocks/browser.ts
import { setupServer } from 'msw/node'

const server = setupServer(...handlers)

// Enable request/response logging
server.listen({ onUnhandledRequest: 'warn' })
```

### Inspect Requests in DevTools

```typescript
const handler = http.post('/api/tasks', async (info) => {
  console.log('Request:', {
    url: info.request.url,
    method: info.request.method,
    headers: Object.fromEntries(info.request.headers),
  })

  const body = await info.request.json()
  console.log('Body:', body)

  return HttpResponse.json({ success: true })
})
```

## References

- [MSW Documentation](https://mswjs.io)
- [HTTP Handlers](https://mswjs.io/docs/api/http)
- [Request Handling](https://mswjs.io/docs/getting-started)
- [Mock Data Patterns](https://mswjs.io/docs/recipes/mocking-error-responses)
