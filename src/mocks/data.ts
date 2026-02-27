import type { Agent } from '../types/agent'

export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Carlos',
    role: 'Senior Developer',
    status: 'thinking',
    currentTask: 'Code Review PR #42',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Ana',
    role: 'Junior Developer',
    status: 'idle',
    currentTask: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Viktor',
    role: 'QA Engineer',
    status: 'thinking',
    currentTask: 'Running Test Suite',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Sophie',
    role: 'DevOps Engineer',
    status: 'error',
    currentTask: 'Deploy Pipeline Failed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'Marcus',
    role: 'Backend Developer',
    status: 'thinking',
    currentTask: 'Implement API Endpoint',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
