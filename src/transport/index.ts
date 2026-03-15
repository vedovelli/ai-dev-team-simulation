/**
 * Notification transport layer
 *
 * Abstracts notification delivery mechanisms (polling, WebSocket, etc.)
 */

export { PollingTransport } from './PollingTransport'
export { WebSocketTransport } from './WebSocketTransport.stub'
export type {
  NotificationTransport,
  NotificationEvent,
  TransportStatus,
  TransportConfig,
} from '../types/notification-transport'
