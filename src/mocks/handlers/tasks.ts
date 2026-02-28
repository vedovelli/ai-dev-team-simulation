import { http, HttpResponse } from 'msw'
import type { Task, PaginatedResponse } from '../../types/task'

const mockTasks: Task[] = [
  {
    id: '1',
    name: 'Setup project structure',
    description: 'Initialize the React project with TypeScript and necessary tooling',
    status: 'done',
    priority: 'high',
    assignee: 'Alice',
    dueDate: '2025-01-15',
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
  },
  {
    id: '2',
    name: 'Implement authentication',
    description: 'Set up user authentication with JWT tokens',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Bob',
    dueDate: '2025-02-15',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-02-20T11:45:00Z',
  },
  {
    id: '3',
    name: 'Build task management UI',
    description: 'Create components for task table and form',
    status: 'todo',
    priority: 'high',
    assignee: undefined,
    dueDate: '2025-03-01',
    createdAt: '2025-02-20T14:00:00Z',
    updatedAt: '2025-02-20T14:00:00Z',
  },
  {
    id: '4',
    name: 'Write API documentation',
    description: 'Document all endpoints with examples',
    status: 'todo',
    priority: 'medium',
    assignee: 'Charlie',
    dueDate: '2025-03-10',
    createdAt: '2025-02-18T10:30:00Z',
    updatedAt: '2025-02-18T10:30:00Z',
  },
  {
    id: '5',
    name: 'Setup database migrations',
    description: 'Configure database schema and initial migrations',
    status: 'done',
    priority: 'high',
    assignee: 'Diana',
    dueDate: '2025-01-20',
    createdAt: '2025-01-08T13:15:00Z',
    updatedAt: '2025-01-20T09:00:00Z',
  },
]

const usedNames = new Set(mockTasks.map((t) => t.name.toLowerCase()))
let nextId = Math.max(...mockTasks.map((t) => parseInt(t.id, 10))) + 1

export const taskHandlers = [
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '10', 10)))
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const assignee = url.searchParams.get('assignee')
    const sortField = (url.searchParams.get('sortField') || 'createdAt') as any
    const sortDirection = (url.searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'

    let filtered = mockTasks

    if (status) filtered = filtered.filter((t) => t.status === status)
    if (priority) filtered = filtered.filter((t) => t.priority === priority)
    if (assignee) filtered = filtered.filter((t) => t.assignee === assignee)

    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof Task] || ''
      const bVal = b[sortField as keyof Task] || ''
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })

    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const data = filtered.slice(start, start + limit)

    return HttpResponse.json<PaginatedResponse<Task>>({
      data,
      total,
      page,
      limit,
      totalPages,
    })
  }),

  http.get('/api/tasks/:id', ({ params }) => {
    const task = mockTasks.find((t) => t.id === params.id)

    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return HttpResponse.json(task)
  }),

  http.post('/api/tasks', async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.name || typeof body.name !== 'string') {
      return HttpResponse.json(
        { error: 'Task name is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.description || typeof body.description !== 'string') {
      return HttpResponse.json(
        { error: 'Task description is required and must be a string' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newTask: Task = {
      id: String(nextId++),
      name: body.name,
      description: body.description,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      assignee: body.assignee,
      dueDate: body.dueDate,
      createdAt: now,
      updatedAt: now,
    }

    mockTasks.push(newTask)
    usedNames.add(body.name.toLowerCase())

    return HttpResponse.json(newTask, { status: 201 })
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const taskIndex = mockTasks.findIndex((t) => t.id === params.id)

    if (taskIndex === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = (await request.json()) as any
    const task = mockTasks[taskIndex]

    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return HttpResponse.json({ error: 'Task name must be a string' }, { status: 400 })
      }
      task.name = body.name
    }

    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        return HttpResponse.json({ error: 'Task description must be a string' }, { status: 400 })
      }
      task.description = body.description
    }

    if (body.status !== undefined) task.status = body.status
    if (body.priority !== undefined) task.priority = body.priority
    if (body.assignee !== undefined) task.assignee = body.assignee
    if (body.dueDate !== undefined) task.dueDate = body.dueDate

    task.updatedAt = new Date().toISOString()

    return HttpResponse.json(task)
  }),

  http.get('/api/tasks/validate-name', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('name')

    if (!name) {
      return HttpResponse.json({ error: 'Name parameter is required' }, { status: 400 })
    }

    const isValid = !usedNames.has(name.toLowerCase())

    return HttpResponse.json({ isValid, name })
  }),
]
