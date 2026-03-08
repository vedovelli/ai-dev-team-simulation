import { http, HttpResponse } from 'msw'
import type { Task } from '../../types/task'

// Simple in-memory storage for tasks and comments
export const tasksStore: Task[] = []
export const commentsStore: Map<
  string,
  Array<{ id: string; author: string; content: string; createdAt: string }>
> = new Map()

/**
 * MSW handlers for task execution endpoints
 * - GET /api/tasks/:id - Fetch task details
 * - POST /api/tasks/:id/execute - Execute task action (start, pause, complete, blocked)
 * - GET /api/tasks/:id/comments - Fetch task comments
 * - POST /api/tasks/:id/comments - Add task comment
 */
export const taskExecutionHandlers = [
  // Get task details
  http.get('/api/tasks/:id', ({ params }) => {
    const { id } = params

    const task = tasksStore.find((t) => t.id === id)
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(task)
  }),

  // Execute task action
  http.post('/api/tasks/:id/execute', async ({ request, params }) => {
    const { id } = params

    const task = tasksStore.find((t) => t.id === id)
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    try {
      const body = (await request.json()) as {
        action: 'start' | 'pause' | 'complete' | 'blocked'
        notes?: string
      }

      // Validate action
      const validActions = ['start', 'pause', 'complete', 'blocked']
      if (!validActions.includes(body.action)) {
        return HttpResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
      }

      // Apply status transition
      const statusMap = {
        start: 'in-progress',
        pause: 'backlog',
        complete: 'done',
        blocked: 'backlog',
      } as const

      const updatedTask: Task = {
        ...task,
        status: statusMap[body.action as keyof typeof statusMap],
        updatedAt: new Date().toISOString(),
      }

      // Update in store
      const taskIndex = tasksStore.findIndex((t) => t.id === id)
      tasksStore[taskIndex] = updatedTask

      return HttpResponse.json(
        {
          task: updatedTask,
          message: `Task ${body.action}ed successfully`,
        },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to execute task action' },
        { status: 500 }
      )
    }
  }),

  // Get task comments
  http.get('/api/tasks/:id/comments', ({ params }) => {
    const { id } = params

    const comments = commentsStore.get(id) || []
    return HttpResponse.json(comments)
  }),

  // Add task comment with optimistic update support
  http.post('/api/tasks/:id/comments', async ({ request, params }) => {
    const { id } = params

    const task = tasksStore.find((t) => t.id === id)
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    try {
      const body = (await request.json()) as {
        content: string
      }

      if (!body.content || !body.content.trim()) {
        return HttpResponse.json(
          { error: 'Comment content is required' },
          { status: 400 }
        )
      }

      // Create new comment
      const newComment = {
        id: `comment-${Date.now()}`,
        author: 'Current User',
        content: body.content,
        createdAt: new Date().toISOString(),
      }

      // Store comment
      if (!commentsStore.has(id)) {
        commentsStore.set(id, [])
      }
      commentsStore.get(id)!.push(newComment)

      return HttpResponse.json(newComment, { status: 201 })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      )
    }
  }),
]
