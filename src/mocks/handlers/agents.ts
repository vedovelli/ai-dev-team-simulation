import { http, HttpResponse } from 'msw'
import { Agent } from '../../types/domain'

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Ana',
    role: 'Frontend Developer',
    availability: 'available',
    completedTasks: 5,
  },
  {
    id: 'agent-2',
    name: 'Carlos',
    role: 'Senior Developer',
    availability: 'available',
    completedTasks: 12,
  },
  {
    id: 'agent-3',
    name: 'Bruno',
    role: 'Backend Developer',
    availability: 'busy',
    currentTask: 'task-2',
    completedTasks: 8,
  },
]

export const agentHandlers = [
  http.get('/api/agents', () => {
    return HttpResponse.json(mockAgents)
  }),

  http.get('/api/agents/:id', ({ params }) => {
    const agent = mockAgents.find(a => a.id === params.id)
    if (!agent) {
      return HttpResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    return HttpResponse.json(agent)
  }),
]
