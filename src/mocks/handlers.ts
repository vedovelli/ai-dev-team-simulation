import { http, HttpResponse } from 'msw'
import type { TeamMember } from '../types/team'

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    role: 'Frontend Developer',
    email: 'alice@example.com',
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Bob Smith',
    role: 'Backend Developer',
    email: 'bob@example.com',
    status: 'active',
    joinedAt: '2024-02-01',
  },
  {
    id: '3',
    name: 'Carol White',
    role: 'Full Stack Developer',
    email: 'carol@example.com',
    status: 'idle',
    joinedAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'David Brown',
    role: 'DevOps Engineer',
    email: 'david@example.com',
    status: 'offline',
    joinedAt: '2024-03-10',
  },
]

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/team-members', () => {
    return HttpResponse.json(mockTeamMembers)
  }),
]
