import { http, HttpResponse } from 'msw'
import type { TeamMember } from '../hooks/useTeamMembers'

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ana Silva',
    role: 'Frontend Developer',
    email: 'ana@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
  },
  {
    id: '2',
    name: 'Carlos Santos',
    role: 'Senior Fullstack Developer',
    email: 'carlos@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  },
  {
    id: '3',
    name: 'Fabio Vedovelli',
    role: 'Tech Lead',
    email: 'fabio@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fabio',
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
