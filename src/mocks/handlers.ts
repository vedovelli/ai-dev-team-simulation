import { http, HttpResponse } from 'msw'
import type { Agent, AgentStatusResponse } from '../types/agent'

// Mock data for agents
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Carlos',
    role: 'senior-dev',
    status: 'idle',
    currentTask: undefined,
    lastUpdated: Date.now(),
  },
  {
    id: '2',
    name: 'Ana',
    role: 'junior-dev',
    status: 'working',
    currentTask: 'Implementing user dashboard',
    lastUpdated: Date.now(),
  },
  {
    id: '3',
    name: 'John',
    role: 'qa',
    status: 'working',
    currentTask: 'Testing authentication flow',
    lastUpdated: Date.now(),
  },
  {
    id: '4',
    name: 'Sarah',
    role: 'devops',
    status: 'idle',
    currentTask: undefined,
    lastUpdated: Date.now(),
  },
  {
    id: '5',
    name: 'Mike',
    role: 'designer',
    status: 'blocked',
    currentTask: 'Waiting for design feedback',
    lastUpdated: Date.now(),
  },
]

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // Get all agents
  http.get('/api/agents', () => {
    return HttpResponse.json(mockAgents)
  }),

  // Get agent status by ID
  http.get('/api/agents/:id/status', ({ params }) => {
    const agent = mockAgents.find((a) => a.id === params.id)

    if (!agent) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const response: AgentStatusResponse = {
      id: agent.id,
      status: agent.status,
      currentTask: agent.currentTask,
      lastUpdated: agent.lastUpdated,
    }

    return HttpResponse.json(response)
  }),
]
