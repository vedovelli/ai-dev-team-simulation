import { http, HttpResponse } from 'msw'
import { mockAgents } from './data'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('/api/agents', () => {
    return HttpResponse.json(mockAgents)
  }),
]
