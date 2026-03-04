/**
 * Advanced MSW Handlers for Data Fetching Examples
 *
 * This file demonstrates best practices for mocking with MSW:
 * - Comprehensive success/error/edge case coverage
 * - Realistic response delays
 * - Proper HTTP status codes and error formats
 * - Request validation
 *
 * These handlers work alongside the existing handlers.ts
 */

import { http, HttpResponse, delay } from 'msw'
import type { Task, UpdateTaskInput } from '../types/task'

/**
 * Mock data
 */
const mockTasks: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'Implement authentication',
    assignee: 'alice',
    team: 'backend',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-1',
    order: 1,
    estimatedHours: 12,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-04T10:00:00Z',
  },
  'task-2': {
    id: 'task-2',
    title: 'Design dashboard UI',
    assignee: 'bob',
    team: 'frontend',
    status: 'backlog',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 2,
    estimatedHours: 8,
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-03T10:00:00Z',
  },
  'task-3': {
    id: 'task-3',
    title: 'Write API tests',
    assignee: 'charlie',
    team: 'qa',
    status: 'done',
    priority: 'medium',
    storyPoints: 3,
    sprint: 'sprint-1',
    order: 3,
    estimatedHours: 5,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-04T15:00:00Z',
  },
}

/**
 * Advanced Handlers
 *
 * These handlers provide comprehensive coverage with realistic scenarios
 */
export const advancedTaskHandlers = [
  /**
   * GET /api/tasks
   * Fetch tasks with optional filtering
   */
  http.get('/api/tasks', async ({ request }) => {
    // Add realistic delay
    await delay(300)

    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    // Filter tasks by status if provided
    const filteredTasks = status
      ? Object.values(mockTasks).filter((task) => task.status === status)
      : Object.values(mockTasks)

    // Return paginated response
    return HttpResponse.json({
      data: filteredTasks,
      pagination: {
        total: filteredTasks.length,
        page: 1,
        perPage: 20,
      },
    })
  }),

  /**
   * GET /api/tasks/:id
   * Fetch a single task by ID
   *
   * Success case: Returns the task
   * Not found case: Returns 404
   */
  http.get('/api/tasks/:id', async ({ params }) => {
    await delay(200)

    const { id } = params
    const task = mockTasks[id as string]

    if (!task) {
      return HttpResponse.json(
        {
          error: 'Task not found',
          message: `Task with id ${id} does not exist`,
        },
        { status: 404 }
      )
    }

    return HttpResponse.json({ data: task })
  }),

  /**
   * POST /api/tasks
   * Create a new task
   *
   * Success case: Returns created task with ID
   * Validation error: Returns 400 if required fields missing
   */
  http.post('/api/tasks', async ({ request }) => {
    await delay(400)

    const body = await request.json() as Partial<Task>

    // Validate required fields
    if (!body.title || !body.team || !body.status || !body.priority) {
      return HttpResponse.json(
        {
          error: 'Validation failed',
          message: 'Missing required fields: title, team, status, priority',
        },
        { status: 400 }
      )
    }

    // Simulate server-side errors in development
    if (body.title?.includes('ERROR')) {
      return HttpResponse.json(
        {
          error: 'Server error',
          message: 'Failed to create task due to server error',
        },
        { status: 500 }
      )
    }

    // Create new task
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: body.title || '',
      assignee: body.assignee || '',
      team: body.team || '',
      status: body.status as any || 'backlog',
      priority: body.priority as any || 'medium',
      storyPoints: body.storyPoints || 0,
      sprint: body.sprint || 'sprint-1',
      order: Object.keys(mockTasks).length + 1,
      estimatedHours: body.estimatedHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockTasks[newTask.id] = newTask
    return HttpResponse.json({ data: newTask }, { status: 201 })
  }),

  /**
   * PATCH /api/tasks/:id
   * Update a task
   *
   * Success case: Returns updated task
   * Not found case: Returns 404
   * Validation error: Returns 400 for invalid updates
   */
  http.patch('/api/tasks/:id', async ({ params, request }) => {
    await delay(350)

    const { id } = params
    const body = await request.json() as UpdateTaskInput
    const task = mockTasks[id as string]

    if (!task) {
      return HttpResponse.json(
        {
          error: 'Task not found',
          message: `Task with id ${id} does not exist`,
        },
        { status: 404 }
      )
    }

    // Validate update payload
    if (body.status && !['backlog', 'in-progress', 'in-review', 'done'].includes(body.status)) {
      return HttpResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid status value',
        },
        { status: 400 }
      )
    }

    // Simulate concurrent update error
    if (body.title?.includes('CONFLICT')) {
      return HttpResponse.json(
        {
          error: 'Conflict',
          message: 'Task was modified by another user',
        },
        { status: 409 }
      )
    }

    // Update task
    const updatedTask: Task = {
      ...task,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    mockTasks[id as string] = updatedTask
    return HttpResponse.json({ data: updatedTask })
  }),

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   *
   * Success case: Returns 204 No Content
   * Not found case: Returns 404
   */
  http.delete('/api/tasks/:id', async ({ params }) => {
    await delay(300)

    const { id } = params
    const task = mockTasks[id as string]

    if (!task) {
      return HttpResponse.json(
        {
          error: 'Task not found',
          message: `Task with id ${id} does not exist`,
        },
        { status: 404 }
      )
    }

    delete mockTasks[id as string]
    return new HttpResponse(null, { status: 204 })
  }),

  /**
   * Network Error Simulation Endpoints
   * These are for testing error handling
   */
  http.get('/api/tasks/network-error', async () => {
    await delay(500)
    return HttpResponse.error()
  }),

  /**
   * Timeout Simulation Endpoint
   * Delays response beyond reasonable timeout
   */
  http.get('/api/tasks/timeout', async () => {
    await delay(30000) // 30 seconds
    return HttpResponse.json({ data: [] })
  }),
]
