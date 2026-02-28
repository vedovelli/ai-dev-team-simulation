import { http, HttpResponse } from 'msw'
import type { Task, UpdateTaskRequest } from '../types/task'

// Mock task database
const tasks: Record<string, Task> = {
  '1': {
    id: '1',
    title: 'Design dashboard layout',
    description: 'Create wireframes and design system',
    status: 'Backlog',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  '2': {
    id: '2',
    title: 'Set up React Query',
    description: 'Integrate TanStack Query for data fetching',
    status: 'In Progress',
    createdAt: '2025-01-02T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  },
  '3': {
    id: '3',
    title: 'Create task components',
    description: 'Build reusable task card and list components',
    status: 'Review',
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2025-01-03T10:00:00Z',
  },
  '4': {
    id: '4',
    title: 'Set up routing',
    description: 'Configure TanStack Router',
    status: 'Done',
    createdAt: '2025-01-04T10:00:00Z',
    updatedAt: '2025-01-04T10:00:00Z',
  },
}

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  http.get('/api/tasks', () => {
    return HttpResponse.json(Object.values(tasks))
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as UpdateTaskRequest

    if (!tasks[id as string]) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    tasks[id as string] = {
      ...tasks[id as string],
      status: body.status,
      updatedAt: new Date().toISOString(),
    }

    return HttpResponse.json(tasks[id as string])
  }),
]
