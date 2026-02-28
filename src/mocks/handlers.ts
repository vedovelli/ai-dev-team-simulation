import { http, HttpResponse } from 'msw'

export const teamsData = [
  {
    id: '1',
    name: 'Frontend Team',
    status: 'active',
    members: 4,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Backend Team',
    status: 'active',
    members: 6,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'DevOps Team',
    status: 'inactive',
    members: 2,
    createdAt: '2023-11-20',
  },
  {
    id: '4',
    name: 'QA Team',
    status: 'active',
    members: 5,
    createdAt: '2024-02-01',
  },
  {
    id: '5',
    name: 'Design Team',
    status: 'inactive',
    members: 3,
    createdAt: '2023-12-05',
  },
]

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/teams', () => {
    return HttpResponse.json(teamsData)
  }),
]
