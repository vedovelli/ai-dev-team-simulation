import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { routeHandlers } from './route-handlers'

export const worker = setupWorker(...routeHandlers, ...handlers)
