/**
 * Real-time sync types for cache abstraction layer + WebSocket infrastructure
 *
 * Defines transport-agnostic interfaces for real-time data synchronization.
 * Supports polling (current) and WebSocket (future) without changing component code.
 */

/**
 * Entity types that can be synchronized in real-time
 */
export type EntityType = 'task' | 'sprint' | 'agent'

/**
 * Entity subscription definition
 * - entity: The entity type to subscribe to
 * - id: Optional specific entity ID; omit to subscribe to all entities of this type
 */
export interface EntitySubscription {
  entity: EntityType
  id?: string
}

/**
 * Connection state for useRealtimeConnection hook
 */
export type ConnectionState = 'connecting' | 'open' | 'closed' | 'error'

/**
 * Real-time event types with discriminated unions for type-safe routing
 * Events trigger targeted query invalidations based on entity type
 */
export interface TaskUpdatedEvent {
  type: 'task:updated'
  taskId: string
  sprintId?: string
  changes: Partial<{
    title: string
    description: string
    status: 'todo' | 'in_progress' | 'done'
    priority: 'low' | 'normal' | 'high'
    assignedAgentId: string
    dueDate: string
  }>
  timestamp: number
}

export interface TaskCreatedEvent {
  type: 'task:created'
  taskId: string
  sprintId: string
  title: string
  timestamp: number
}

export interface TaskDeletedEvent {
  type: 'task:deleted'
  taskId: string
  sprintId?: string
  timestamp: number
}

export interface SprintUpdatedEvent {
  type: 'sprint:updated'
  sprintId: string
  changes: Partial<{
    name: string
    status: 'planning' | 'active' | 'completed'
    startDate: number
    endDate: number
  }>
  timestamp: number
}

export interface SprintStartedEvent {
  type: 'sprint:started'
  sprintId: string
  timestamp: number
}

export interface SprintCompletedEvent {
  type: 'sprint:completed'
  sprintId: string
  timestamp: number
}

export interface AgentStatusChangedEvent {
  type: 'agent:status-changed'
  agentId: string
  status: 'active' | 'idle' | 'offline'
  timestamp: number
}

export interface AgentCapacityChangedEvent {
  type: 'agent:capacity-changed'
  agentId: string
  capacity: number
  currentLoad: number
  timestamp: number
}

export interface NotificationEvent {
  type: 'notification:new'
  notificationId: string
  userId: string
  message: string
  timestamp: number
}

/**
 * Discriminated union of all real-time events
 * Enables exhaustive type checking and smart routing
 */
export type RealtimeEvent =
  | TaskUpdatedEvent
  | TaskCreatedEvent
  | TaskDeletedEvent
  | SprintUpdatedEvent
  | SprintStartedEvent
  | SprintCompletedEvent
  | AgentStatusChangedEvent
  | AgentCapacityChangedEvent
  | NotificationEvent

/**
 * Event router configuration for routing events to query invalidation
 * Maps event types to query keys that should be invalidated
 */
export interface EventRouterConfig {
  [key in RealtimeEvent['type']]?: (string | number)[]
}

/**
 * Default event routing configuration
 * Specifies which query keys should be invalidated for each event type
 */
export const DEFAULT_EVENT_ROUTES: EventRouterConfig = {
  'task:updated': ['tasks'],
  'task:created': ['tasks'],
  'task:deleted': ['tasks'],
  'sprint:updated': ['sprints'],
  'sprint:started': ['sprints'],
  'sprint:completed': ['sprints'],
  'agent:status-changed': ['agents'],
  'agent:capacity-changed': ['agents'],
  'notification:new': ['notifications'],
}

/**
 * Real-time update event payload
 * Generic payload that can be extended per entity type
 */
export interface RealtimeUpdateEvent<T = unknown> {
  /** Subscription that triggered this update */
  subscription: EntitySubscription
  /** Payload data (entity update details) */
  payload: T
  /** Server timestamp */
  timestamp: number
}

/**
 * Update callback function signature
 */
export type UpdateCallback<T = unknown> = (event: RealtimeUpdateEvent<T>) => void

/**
 * Transport interface for pluggable real-time implementations
 * Allows switching between polling and WebSocket without component changes
 */
export interface RealtimeTransport {
  /** Subscribe to entity updates */
  subscribe(subscriptions: EntitySubscription[], callback: UpdateCallback): void
  /** Unsubscribe from entity updates */
  unsubscribe(): void
  /** Check if transport is connected/active */
  isConnected(): boolean
  /** Handle cleanup on unmount */
  cleanup(): void
}

/**
 * Polling transport implementation configuration
 */
export interface PollingTransportConfig {
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollInterval?: number
  /** Enable exponential backoff on errors */
  enableExponentialBackoff?: boolean
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number
}

/**
 * Batch update configuration for high-frequency scenarios
 */
export interface BatchUpdateConfig {
  /** Enable batch updates (default: true) */
  enabled: boolean
  /** Batch timeout in milliseconds (default: 500) */
  timeout?: number
  /** Maximum batch size (default: 10) */
  maxSize?: number
}

/**
 * Hook options for useRealtimeSync
 */
export interface UseRealtimeSyncOptions {
  /** Entity subscriptions to monitor */
  subscriptions: EntitySubscription[]
  /** Callback for incoming updates */
  onUpdate: UpdateCallback
  /** Polling configuration */
  pollingConfig?: PollingTransportConfig
  /** Batch update settings for high-frequency scenarios */
  batchConfig?: BatchUpdateConfig
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Return type for useRealtimeSync hook
 */
export interface UseRealtimeSyncReturn {
  /** Whether the transport is actively syncing */
  isConnected: boolean
  /** Latest error, if any */
  error: Error | null
  /** Refetch data immediately */
  refetch: () => Promise<void>
  /** Update subscriptions dynamically */
  updateSubscriptions: (subscriptions: EntitySubscription[]) => void
  /** Stop syncing */
  disconnect: () => void
}

/**
 * Supported entity update types
 * Extensible for future entity types
 */
export interface TaskUpdate {
  id: string
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'normal' | 'high'
  assignedAgentId?: string
  updatedAt?: number
  [key: string]: unknown
}

export interface SprintUpdate {
  id: string
  name?: string
  status?: 'planning' | 'active' | 'completed'
  startDate?: number
  endDate?: number
  updatedAt?: number
  [key: string]: unknown
}

export interface AgentUpdate {
  id: string
  name?: string
  status?: 'active' | 'idle' | 'offline'
  capacity?: number
  tasksAssigned?: number
  updatedAt?: number
  [key: string]: unknown
}

/**
 * Discriminated union type for entity updates
 */
export type EntityUpdate =
  | { entity: 'task'; data: TaskUpdate }
  | { entity: 'sprint'; data: SprintUpdate }
  | { entity: 'agent'; data: AgentUpdate }
