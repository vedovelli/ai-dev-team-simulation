import { http, HttpResponse } from 'msw'
import { taskHandlers } from './handlers/tasks'

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  ...taskHandlers,
]
