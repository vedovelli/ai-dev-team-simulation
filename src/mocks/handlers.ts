import { http, HttpResponse } from 'msw'
import type { Agent, AgentStatus } from '../types/agent'

interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
}

// In-memory store for teams
const teamsStore: Team[] = []

// Seed data for agents
const agentRoles = [
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'QA Engineer',
  'Product Manager',
  'UI Designer',
  'Database Administrator',
  'Security Engineer',
]

const agentTasks = [
  'Implementing user authentication',
  'Fixing critical bug in payment system',
  'Writing unit tests for API',
  'Reviewing pull requests',
  'Optimizing database queries',
  'Deploying to production',
  'Setting up CI/CD pipeline',
  'Designing system architecture',
  'Creating documentation',
  'Debugging memory leak',
]

const agentStatuses: AgentStatus[] = [
  'idle',
  'working',
  'blocked',
  'completed',
]

function generateAgents(count: number): Agent[] {
  const agents: Agent[] = []
  for (let i = 1; i <= count; i++) {
    const status = agentStatuses[Math.floor(Math.random() * agentStatuses.length)]
    agents.push({
      id: `agent-${i}`,
      name: `Agent ${i}`,
      role: agentRoles[Math.floor(Math.random() * agentRoles.length)],
      status,
      currentTask: status !== 'idle' && status !== 'completed' ? agentTasks[Math.floor(Math.random() * agentTasks.length)] : null,
      output: status === 'completed' ? `Completed task at ${new Date().toISOString()}` : null,
    })
  }
  return agents
}

const agentsStore: Agent[] = generateAgents(50)

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  http.post('/api/teams', async ({ request }) => {
    const body = await request.json() as Omit<Team, 'id' | 'createdAt'>

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }

    teamsStore.push(newTeam)
    return HttpResponse.json(newTeam, { status: 201 })
  }),

  http.get('/api/teams', () => {
    return HttpResponse.json(teamsStore)
  }),

  http.get('/api/agents', () => {
    return HttpResponse.json(agentsStore)
  }),
]
