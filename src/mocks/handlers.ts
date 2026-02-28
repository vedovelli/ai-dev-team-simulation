import { http, HttpResponse } from 'msw'
import type { TaskFormData, Task } from '../types/task'

// In-memory task storage for demo purposes
const tasksStore: Map<string, Task> = new Map()
const existingNames: Set<string> = new Set()

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // Get all tasks
  http.get('/api/tasks', () => {
    return HttpResponse.json(Array.from(tasksStore.values()))
  }),

  // Get single task
  http.get('/api/tasks/:id', ({ params }) => {
    const task = tasksStore.get(params.id as string)
    if (!task) {
      return HttpResponse.json({ message: 'Task not found' }, { status: 404 })
    }
    return HttpResponse.json(task)
  }),

  // Validate task name uniqueness
  http.get('/api/tasks/validate-name', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('name')

    if (!name) {
      return HttpResponse.json(
        { message: 'Name parameter is required' },
        { status: 400 },
      )
    }

    if (existingNames.has(name.toLowerCase())) {
      return HttpResponse.json(
        { message: 'Task name already exists' },
        { status: 409 },
      )
    }

    return HttpResponse.json({ valid: true })
  }),

  // Create task
  http.post('/api/tasks', async ({ request }) => {
    const data = (await request.json()) as TaskFormData

    // Validate required fields
    if (!data.name || data.name.length < 3 || data.name.length > 100) {
      return HttpResponse.json(
        { message: 'Invalid task name' },
        { status: 400 },
      )
    }

    // Check for duplicate name
    if (existingNames.has(data.name.toLowerCase())) {
      return HttpResponse.json(
        { message: 'Task name already exists' },
        { status: 409 },
      )
    }

    if (data.description && data.description.length > 500) {
      return HttpResponse.json(
        { message: 'Description too long' },
        { status: 400 },
      )
    }

    // Validate status
    if (!['todo', 'in-progress', 'done'].includes(data.status)) {
      return HttpResponse.json(
        { message: 'Invalid status' },
        { status: 400 },
      )
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(data.priority)) {
      return HttpResponse.json(
        { message: 'Invalid priority' },
        { status: 400 },
      )
    }

    // Validate due date requirement for high priority
    if (data.priority === 'high' && !data.dueDate) {
      return HttpResponse.json(
        { message: 'Due date required for high priority tasks' },
        { status: 400 },
      )
    }

    // Validate tags requirement for non-todo
    if (data.status !== 'todo' && data.tags.length === 0) {
      return HttpResponse.json(
        { message: 'Tags required for non-todo tasks' },
        { status: 400 },
      )
    }

    const id = generateId()
    const now = new Date().toISOString()
    const task: Task = {
      id,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      tags: data.tags,
      createdAt: now,
      updatedAt: now,
    }

    tasksStore.set(id, task)
    existingNames.add(data.name.toLowerCase())

    return HttpResponse.json(task, { status: 201 })
  }),

  // Update task
  http.put('/api/tasks/:id', async ({ params, request }) => {
    const taskId = params.id as string
    const data = (await request.json()) as TaskFormData

    const existingTask = tasksStore.get(taskId)
    if (!existingTask) {
      return HttpResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    // Validate name if changed
    if (data.name !== existingTask.name) {
      if (!data.name || data.name.length < 3 || data.name.length > 100) {
        return HttpResponse.json(
          { message: 'Invalid task name' },
          { status: 400 },
        )
      }

      if (existingNames.has(data.name.toLowerCase())) {
        return HttpResponse.json(
          { message: 'Task name already exists' },
          { status: 409 },
        )
      }

      // Remove old name from set
      existingNames.delete(existingTask.name.toLowerCase())
      existingNames.add(data.name.toLowerCase())
    }

    if (data.description && data.description.length > 500) {
      return HttpResponse.json(
        { message: 'Description too long' },
        { status: 400 },
      )
    }

    // Validate status
    if (!['todo', 'in-progress', 'done'].includes(data.status)) {
      return HttpResponse.json(
        { message: 'Invalid status' },
        { status: 400 },
      )
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(data.priority)) {
      return HttpResponse.json(
        { message: 'Invalid priority' },
        { status: 400 },
      )
    }

    // Validate due date requirement for high priority
    if (data.priority === 'high' && !data.dueDate) {
      return HttpResponse.json(
        { message: 'Due date required for high priority tasks' },
        { status: 400 },
      )
    }

    // Validate tags requirement for non-todo
    if (data.status !== 'todo' && data.tags.length === 0) {
      return HttpResponse.json(
        { message: 'Tags required for non-todo tasks' },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const updatedTask: Task = {
      ...existingTask,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      tags: data.tags,
      updatedAt: now,
    }

    tasksStore.set(taskId, updatedTask)

    return HttpResponse.json(updatedTask)
  }),

  // Delete task
  http.delete('/api/tasks/:id', ({ params }) => {
    const taskId = params.id as string
    const task = tasksStore.get(taskId)

    if (!task) {
      return HttpResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    tasksStore.delete(taskId)
    existingNames.delete(task.name.toLowerCase())

    return HttpResponse.json({ message: 'Task deleted' })
  }),
]
