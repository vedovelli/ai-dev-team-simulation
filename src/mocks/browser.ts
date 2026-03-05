import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { routeHandlers } from './route-handlers'
import { validationHandlers } from './validationHandlers'

export const worker = setupWorker(...routeHandlers, ...handlers, ...validationHandlers)
