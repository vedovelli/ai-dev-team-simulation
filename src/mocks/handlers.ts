import { http, HttpResponse } from 'msw'
import type { TeamMembersResponse } from '../types/team'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/team-members', () => {
    const response: TeamMembersResponse = {
      members: [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          role: 'Senior Developer',
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          role: 'Frontend Developer',
        },
        {
          id: '3',
          name: 'Carol Davis',
          email: 'carol@example.com',
          role: 'Product Manager',
        },
        {
          id: '4',
          name: 'David Wilson',
          email: 'david@example.com',
          role: 'DevOps Engineer',
        },
      ],
    }
    return HttpResponse.json(response)
  }),
]
