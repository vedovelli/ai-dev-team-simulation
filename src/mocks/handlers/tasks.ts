import { http, HttpResponse } from 'msw'
import { Task, TaskState } from '../../types/domain'

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication to the API',
    state: TaskState.DONE,
    assignedTo: 'agent-2',
    sprintId: 'sprint-1',
    complexity: 'SENIOR',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-05T14:00:00Z',
    completedAt: '2026-01-05T14:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Create dashboard components',
    description: 'Build reusable dashboard UI components',
    state: TaskState.IN_PROGRESS,
    assignedTo: 'agent-3',
    sprintId: 'sprint-1',
    complexity: 'JUNIOR',
    createdAt: '2026-01-02T09:00:00Z',
    updatedAt: '2026-02-27T11:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Database optimization',
    description: 'Optimize query performance for large datasets',
    state: TaskState.TODO,
    sprintId: 'sprint-1',
    complexity: 'SENIOR',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Write API tests',
    description: 'Create comprehensive test suite for API endpoints',
    state: TaskState.IN_REVIEW,
    assignedTo: 'agent-1',
    sprintId: 'sprint-2',
    complexity: 'JUNIOR',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-26T15:00:00Z',
  },
]

export const taskHandlers = [
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url)
    const state = url.searchParams.get('state')
    const sprintId = url.searchParams.get('sprintId')
    const assignedTo = url.searchParams.get('assignedTo')

    let filtered = [...mockTasks]

    if (state) {
      filtered = filtered.filter(t => t.state === state)
    }
    if (sprintId) {
      filtered = filtered.filter(t => t.sprintId === sprintId)
    }
    if (assignedTo) {
      filtered = filtered.filter(t => t.assignedTo === assignedTo)
    }

    return HttpResponse.json(filtered)
  }),

  http.get('/api/tasks/:id', ({ params }) => {
    const task = mockTasks.find(t => t.id === params.id)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    return HttpResponse.json(task)
  }),

  http.post('/api/tasks/:id/complete', ({ params }) => {
    const task = mockTasks.find(t => t.id === params.id)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask: Task = {
      ...task,
      state: TaskState.DONE,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const index = mockTasks.findIndex(t => t.id === params.id)
    mockTasks[index] = updatedTask

    return HttpResponse.json(updatedTask)
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const task = mockTasks.find(t => t.id === params.id)
    if (!task) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updates = (await request.json()) as Partial<Task>
    const updatedTask: Task = {
      ...task,
      ...updates,
      id: task.id,
      sprintId: task.sprintId,
      createdAt: task.createdAt,
      updatedAt: new Date().toISOString(),
    }

    const index = mockTasks.findIndex(t => t.id === params.id)
    mockTasks[index] = updatedTask

    return HttpResponse.json(updatedTask)
  }),
]
