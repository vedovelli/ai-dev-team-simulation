import { http, HttpResponse } from 'msw'
import { Sprint } from '../../types/domain'

const mockSprints: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 1 - Foundation',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-15T23:59:59Z',
    status: 'completed',
    tasks: ['task-1', 'task-2', 'task-3'],
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2 - Features',
    startDate: '2026-01-16T00:00:00Z',
    endDate: '2026-01-31T23:59:59Z',
    status: 'active',
    tasks: ['task-4'],
  },
  {
    id: 'sprint-3',
    name: 'Sprint 3 - Optimization',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-15T23:59:59Z',
    status: 'planning',
    tasks: [],
  },
]

export const sprintHandlers = [
  http.get('/api/sprints', () => {
    return HttpResponse.json(mockSprints)
  }),

  http.get('/api/sprints/:id', ({ params }) => {
    const sprint = mockSprints.find(s => s.id === params.id)
    if (!sprint) {
      return HttpResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }
    return HttpResponse.json(sprint)
  }),

  http.get('/api/sprints/:id/tasks', ({ params }) => {
    const sprint = mockSprints.find(s => s.id === params.id)
    if (!sprint) {
      return HttpResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }
    return HttpResponse.json(sprint.tasks)
  }),
]
