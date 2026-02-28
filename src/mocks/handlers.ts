import { http, HttpResponse } from 'msw'

export type Task = {
  id: string
  name: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

const mockTasks: Task[] = Array.from({ length: 47 }, (_, i) => ({
  id: `task-${i + 1}`,
  name: `Task ${i + 1}`,
  status: ['todo', 'in-progress', 'done'][i % 3] as Task['status'],
  priority: ['low', 'medium', 'high'][i % 3] as Task['priority'],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}))

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/tasks', () => {
    return HttpResponse.json({ data: mockTasks })
  }),
]
