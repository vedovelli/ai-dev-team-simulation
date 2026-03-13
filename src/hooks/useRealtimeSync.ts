import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  EntitySubscription,
  RealtimeUpdateEvent,
  UpdateCallback,
  UseRealtimeSyncOptions,
  UseRealtimeSyncReturn,
  PollingTransportConfig,
  BatchUpdateConfig,
} from '../types/realtime'

/**
 * Polling-based transport implementation
 * Provides real-time cache sync via polling (future: WebSocket)
 */
class PollingTransport {
  private subscriptions: EntitySubscription[] = []
  private callback: UpdateCallback | null = null
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isConnected = false
  private retryCount = new Map<string, number>()
  private config: PollingTransportConfig
  private batchQueue: RealtimeUpdateEvent[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private batchConfig: BatchUpdateConfig

  constructor(config: PollingTransportConfig = {}, batchConfig: BatchUpdateConfig = { enabled: false }) {
    this.config = {
      pollInterval: 30000,
      enableExponentialBackoff: true,
      maxRetries: 3,
      ...config,
    }
    this.batchConfig = {
      enabled: false,
      timeout: 500,
      maxSize: 10,
      ...batchConfig,
    }
  }

  subscribe(subscriptions: EntitySubscription[], callback: UpdateCallback): void {
    this.subscriptions = subscriptions
    this.callback = callback
    this.isConnected = true
    this.startPolling()
  }

  unsubscribe(): void {
    this.stopPolling()
    this.callback = null
    this.isConnected = false
  }

  isConnectedNow(): boolean {
    return this.isConnected
  }

  private startPolling(): void {
    // Group subscriptions by entity type
    const entityTypes = new Set(this.subscriptions.map((s) => s.entity))

    entityTypes.forEach((entity) => {
      this.pollEntity(entity)
    })
  }

  private pollEntity(entity: string): void {
    const pollKey = `poll_${entity}`

    // Clear existing interval
    if (this.pollIntervals.has(pollKey)) {
      clearInterval(this.pollIntervals.get(pollKey))
    }

    // Fetch immediately
    this.fetchEntity(entity)

    // Then set up polling
    const interval = setInterval(() => {
      this.fetchEntity(entity)
    }, this.config.pollInterval)

    this.pollIntervals.set(pollKey, interval)
  }

  private async fetchEntity(entity: string): Promise<void> {
    try {
      const response = await fetch(`/api/realtime/sync?entity=${entity}`)
      if (!response.ok) throw new Error(`${response.statusText}`)

      const updates: RealtimeUpdateEvent[] = await response.json()

      // Filter updates to match subscriptions
      const relevantUpdates = updates.filter((update) =>
        this.subscriptions.some(
          (sub) =>
            sub.entity === entity &&
            (!sub.id || (update.payload && (update.payload as Record<string, unknown>).id === sub.id))
        )
      )

      // Process updates
      relevantUpdates.forEach((update) => {
        if (this.batchConfig.enabled && this.batchConfig.enabled) {
          this.enqueueBatchUpdate(update)
        } else {
          this.callback?.(update)
        }
      })

      // Reset retry count on success
      this.retryCount.delete(`retry_${entity}`)
    } catch (error) {
      this.handleFetchError(entity, error)
    }
  }

  private handleFetchError(entity: string, error: unknown): void {
    const retryKey = `retry_${entity}`
    const attempt = (this.retryCount.get(retryKey) || 0) + 1

    if (attempt <= this.config.maxRetries!) {
      this.retryCount.set(retryKey, attempt)

      if (this.config.enableExponentialBackoff) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
        setTimeout(() => this.fetchEntity(entity), delay)
      }
    }
  }

  private enqueueBatchUpdate(update: RealtimeUpdateEvent): void {
    this.batchQueue.push(update)

    // Flush if batch size reached
    if (this.batchQueue.length >= this.batchConfig.maxSize!) {
      this.flushBatch()
      return
    }

    // Reset timer
    if (this.batchTimer) clearTimeout(this.batchTimer)

    this.batchTimer = setTimeout(() => {
      this.flushBatch()
    }, this.batchConfig.timeout)
  }

  private flushBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    if (this.batchQueue.length > 0) {
      // Batch flush: send all updates at once
      this.batchQueue.forEach((update) => {
        this.callback?.(update)
      })
      this.batchQueue = []
    }
  }

  private stopPolling(): void {
    this.pollIntervals.forEach((interval) => clearInterval(interval))
    this.pollIntervals.clear()

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }

  cleanup(): void {
    this.stopPolling()
    this.flushBatch()
  }
}

/**
 * useRealtimeSync Hook
 *
 * Transport-agnostic cache synchronization for polling/WebSocket.
 * Automatically invalidates related query cache keys on entity updates.
 *
 * Features:
 * - Entity subscription management (task, sprint, agent)
 * - Automatic cache invalidation on updates
 * - Batch update handling for high-frequency scenarios
 * - Exponential backoff retry logic
 * - WebSocket-ready architecture (polling now, WebSocket later)
 *
 * @example
 * ```tsx
 * const { isConnected, error, refetch } = useRealtimeSync({
 *   subscriptions: [
 *     { entity: 'task', id: taskId },
 *     { entity: 'sprint' },
 *   ],
 *   onUpdate: (event) => {
 *     console.log('Task updated:', event.payload)
 *   },
 *   pollingConfig: { pollInterval: 30000 },
 *   batchConfig: { enabled: true, timeout: 500 },
 * })
 * ```
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
  const { subscriptions, onUpdate, pollingConfig, batchConfig, debug } = options
  const queryClient = useQueryClient()
  const transportRef = useRef<PollingTransport | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Wrapped callback that handles cache invalidation
  const handleUpdate = useCallback(
    (event: RealtimeUpdateEvent) => {
      if (debug) {
        console.log('[useRealtimeSync]', event.subscription.entity, event.payload)
      }

      // Invalidate related query keys based on entity type
      invalidateRelatedQueries(queryClient, event.subscription.entity, event.payload)

      // Call user callback
      onUpdate(event)
    },
    [onUpdate, queryClient, debug]
  )

  // Initialize transport
  useEffect(() => {
    if (!transportRef.current) {
      transportRef.current = new PollingTransport(pollingConfig, batchConfig)
    }

    transportRef.current.subscribe(subscriptions, handleUpdate)
    setIsConnected(true)
    setError(null)

    return () => {
      transportRef.current?.unsubscribe()
    }
  }, [subscriptions, handleUpdate, pollingConfig, batchConfig])

  // Update subscriptions dynamically
  const updateSubscriptions = useCallback((newSubscriptions: EntitySubscription[]) => {
    if (transportRef.current) {
      transportRef.current.unsubscribe()
      transportRef.current.subscribe(newSubscriptions, handleUpdate)
    }
  }, [handleUpdate])

  // Manual refetch
  const refetch = useCallback(async () => {
    try {
      setError(null)
      // Refetch all related query keys
      subscriptions.forEach((sub) => {
        const queryKeys = buildQueryKeysForEntity(sub.entity, sub.id)
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Refetch failed'))
    }
  }, [subscriptions, queryClient])

  // Disconnect
  const disconnect = useCallback(() => {
    transportRef.current?.unsubscribe()
    setIsConnected(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      transportRef.current?.cleanup()
    }
  }, [])

  return {
    isConnected,
    error,
    refetch,
    updateSubscriptions,
    disconnect,
  }
}

/**
 * Build query keys for a given entity type
 * Used for cache invalidation when updates arrive
 */
function buildQueryKeysForEntity(entity: string, id?: string): unknown[][] {
  const keys: unknown[][] = []

  switch (entity) {
    case 'task': {
      if (id) {
        keys.push(['tasks', id])
        keys.push(['tasks', id, 'details'])
      }
      // Always invalidate lists
      keys.push(['tasks'])
      keys.push(['tasks', 'list'])
      break
    }
    case 'sprint': {
      if (id) {
        keys.push(['sprints', id])
        keys.push(['sprints', id, 'metrics'])
        keys.push(['sprints', id, 'tasks'])
      }
      keys.push(['sprints'])
      keys.push(['sprints', 'list'])
      break
    }
    case 'agent': {
      if (id) {
        keys.push(['agents', id])
        keys.push(['agents', id, 'status'])
        keys.push(['agents', id, 'tasks'])
      }
      keys.push(['agents'])
      keys.push(['agents', 'list'])
      break
    }
  }

  return keys
}

/**
 * Invalidate all related query keys for an entity update
 */
function invalidateRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  entity: string,
  payload: unknown
): void {
  const keys = buildQueryKeysForEntity(
    entity,
    (payload && typeof payload === 'object' && (payload as Record<string, unknown>).id) as string | undefined
  )

  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key })
  })
}
