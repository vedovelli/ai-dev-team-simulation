import { http, HttpResponse } from 'msw'
import type { TeamMember } from '../types'

const mockTeamMembers: Record<string, TeamMember> = {
  'member-1': {
    id: 'member-1',
    name: 'Alice Johnson',
    role: 'Frontend Engineer',
    status: 'active',
    tasksCompleted: 42,
    performanceScore: 95,
    recentActivity: 'Completed feature implementation',
  },
  'member-2': {
    id: 'member-2',
    name: 'Bob Smith',
    role: 'Backend Engineer',
    status: 'active',
    tasksCompleted: 38,
    performanceScore: 88,
    recentActivity: 'Fixed API endpoint',
  },
  'member-3': {
    id: 'member-3',
    name: 'Carol Davis',
    role: 'DevOps Engineer',
    status: 'idle',
    tasksCompleted: 25,
    performanceScore: 92,
    recentActivity: 'Deployed to staging',
  },
}

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/team-members/:id', ({ params }) => {
    const member = mockTeamMembers[params.id as string]
    if (!member) {
      return HttpResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json(member)
  }),
]
