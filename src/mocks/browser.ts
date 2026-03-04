import { setupWorker } from 'msw/browser'
import { allHandlers } from './handlers'

export const worker = setupWorker(...allHandlers)
