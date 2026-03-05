import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import { routeHandlers } from './route-handlers'

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...routeHandlers, ...handlers)
