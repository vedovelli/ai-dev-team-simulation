import { http, HttpResponse } from 'msw'
import { agentHandlers } from './handlers/agents'
import { taskHandlers } from './handlers/tasks'
import { sprintHandlers } from './handlers/sprints'

const healthHandler = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
]

export const handlers = [...healthHandler, ...agentHandlers, ...taskHandlers, ...sprintHandlers]
