/**
 * MSW Handlers for Task Management with Conflict Detection
 *
 * Endpoints:
 * - PATCH /api/tasks/:id - Update task with version-based conflict detection
 *
 * Conflict Simulation:
 * - ~5% chance of returning 409 Conflict when version mismatches
 * - Returns serverVersion in conflict response for UI diffing
 */

import { http, HttpResponse } from 'msw'
import type { Task, UpdateTaskInput } from '../../types/task'

/**
 * In-memory store for task versions
 * In production, this would be persisted in database
 */
const taskVersionStore: Record<string, number> = {
  'task-1': 1,
  'task-2': 1,
  'task-3': 1,
  'task-4': 1,
  'task-5': 1,
  'task-6': 1,
  'task-7': 1,
  'task-8': 1,
  'task-9': 1,
  'task-10': 1,
  'task-11': 1,
  'task-12': 1,
  'task-13': 1,
  'task-14': 1,
}

/**
 * Mock task data (matches tableRouter mock data)
 */
const mockTasksData: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'Implement authentication',
    assignee: 'agent-1',
    team: 'backend',
    status: 'in-progress',
    priority: 'high',
    storyPoints: 8,
    sprint: 'sprint-1',
    order: 1,
    estimatedHours: 16,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-2': {
    id: 'task-2',
    title: 'Design database schema',
    assignee: 'agent-2',
    team: 'backend',
    status: 'backlog',
    priority: 'high',
    storyPoints: 13,
    sprint: 'sprint-2',
    order: 2,
    estimatedHours: 24,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-3': {
    id: 'task-3',
    title: 'API documentation',
    assignee: 'agent-1',
    team: 'platform',
    status: 'done',
    priority: 'medium',
    storyPoints: 5,
    sprint: 'sprint-1',
    order: 3,
    estimatedHours: 8,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-4': {
    id: 'task-4',
    title: 'Fix login bug',
    assignee: 'agent-3',
    team: 'frontend',
    status: 'in-review',
    priority: 'high',
    storyPoints: 3,
    sprint: 'sprint-1',
    order: 4,
    estimatedHours: 4,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
  'task-5': {
    id: 'task-5',
    title: 'Optimize queries',
    assignee: 'agent-2',
    team: 'backend',
    status: 'backlog',
    priority: 'low',
    storyPoints: 5,
    sprint: 'sprint-3',
    order: 5,
    estimatedHours: 10,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
  },
}

/**
 * PATCH /api/tasks/:id
 * Update a task with version-based conflict detection
 */
export const taskHandlers = [
  http.patch('/api/tasks/:id', async ({ params, request }) => {
    try {
      const { id } = params
      const body = (await request.json()) as UpdateTaskInput & { version?: number }

      const task = mockTasksData[id as keyof typeof mockTasksData]
      if (!task) {
        return HttpResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        )
      }

      // Check version if provided (conflict detection)
      if (body.version !== undefined) {
        const serverVersion = taskVersionStore[id as keyof typeof taskVersionStore] || 1

        // Simulate ~5% conflict rate when version mismatches
        if (body.version !== serverVersion && Math.random() < 0.05) {
          return HttpResponse.json(
            {
              error: 'conflict',
              serverVersion: {
                ...task,
                version: serverVersion,
              },
            },
            { status: 409 }
          )
        }

        // Check actual version match
        if (body.version !== serverVersion) {
          return HttpResponse.json(
            {
              error: 'conflict',
              serverVersion: {
                ...task,
                version: serverVersion,
              },
            },
            { status: 409 }
          )
        }
      }

      // Update task
      const updatedTask: Task = {
        ...task,
        ...body,
        version: (task.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      }

      // Increment version in store
      taskVersionStore[id as keyof typeof taskVersionStore] = updatedTask.version

      // Update in mock data
      mockTasksData[id as keyof typeof mockTasksData] = updatedTask

      // Return updated task with X-Resource-Version header
      return HttpResponse.json(updatedTask, {
        headers: {
          'X-Resource-Version': String(updatedTask.version),
        },
      })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }),

  /**
   * GET /api/tasks/:id
   * Fetch a single task with version header
   */
  http.get('/api/tasks/:id', ({ params }) => {
    const { id } = params
    const task = mockTasksData[id as keyof typeof mockTasksData]

    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(task, {
      headers: {
        'X-Resource-Version': String(task.version),
      },
    })
  }),
]
