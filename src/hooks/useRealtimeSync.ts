import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { PendingEvent } from '../mocks/handlers/events'

/**
 * Return type for useRealtimeSync hook
 */
export interface UseRealtimeSyncReturn {
  /** Timestamp of last successful sync */
  lastSyncedAt: Date | null
  /** Whether currently fetching pending events */
  isSyncing: boolean
  /** Latest error from sync attempt, if any */
  syncError: Error | null
  /** Manually trigger a poll outside the scheduled interval */
  forceSync: () => void
}

/**
 * Map event types to the query keys they should invalidate
 * Enables coordinated cache invalidation across related queries
 */
function getQueryKeysToInvalidate(event: PendingEvent): string[][] {
  const queryKeys: string[][] = []
  const { type, payload } = event

  switch (type) {
    case 'task_completed':
    case 'task_updated':
      // Invalidate tasks list for the sprint
      if (payload.sprintId) {
        queryKeys.push(['sprints', payload.sprintId, 'tasks'])
      }
      break

    case 'sprint_updated':
      // Invalidate sprint detail
      if (payload.sprintId) {
        queryKeys.push(['sprints', payload.sprintId])
      }
      break

    case 'agent_reassigned':
      // Invalidate agents list and all tasks
      queryKeys.push(['agents'])
      queryKeys.push(['tasks'])
      break

    case 'notification_created':
      // Invalidate notifications
      queryKeys.push(['notifications'])
      break
  }

  return queryKeys
}

/**
 * Hook for real-time sprint and task synchronization via polling
 *
 * Polls `/api/events/pending` every 10 seconds to fetch events that trigger cache invalidation.
 * Enables other views to reflect mutations promptly without full WebSocket infrastructure.
 *
 * Architecture is designed so WebSocket transport can replace polling later without changing
 * the consumer API.
 *
 * @param sprintId - The sprint ID to sync for
 * @returns Object with sync state and forceSync control method
 */
export function useRealtimeSync(sprintId: string): UseRealtimeSyncReturn {
  const queryClient = useQueryClient()
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<Error | null>(null)

  // Use ref to track the last sync timestamp for cursor-based polling
  const lastSyncTimestampRef = useRef<number>(Date.now())
  // Use ref for the polling interval ID
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Perform a single poll of pending events and invalidate affected caches
   */
  const poll = async () => {
    setIsSyncing(true)
    setSyncError(null)

    try {
      const since = new Date(lastSyncTimestampRef.current).toISOString()
      const params = new URLSearchParams({
        since,
        sprintId,
      })

      const response = await fetch(`/api/events/pending?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch pending events: ${response.statusText}`)
      }

      const data = (await response.json()) as {
        events: PendingEvent[]
        cursor: string
      }

      // Update last sync timestamp to current time for next poll
      lastSyncTimestampRef.current = Date.now()
      setLastSyncedAt(new Date())

      // Invalidate query caches based on event types received
      for (const event of data.events) {
        const queryKeysToInvalidate = getQueryKeysToInvalidate(event)

        // Invalidate each affected query key
        for (const queryKey of queryKeysToInvalidate) {
          await queryClient.invalidateQueries({
            queryKey,
          })
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown sync error')
      setSyncError(err)
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Manually trigger a poll outside the normal schedule
   */
  const forceSync = () => {
    poll().catch((err) => {
      console.error('Force sync failed:', err)
    })
  }

  /**
   * Set up polling interval on mount, clean up on unmount
   */
  useEffect(() => {
    // Initial poll on mount
    poll().catch((err) => {
      console.error('Initial sync failed:', err)
    })

    // Set up 10-second polling interval
    pollIntervalRef.current = setInterval(() => {
      poll().catch((err) => {
        console.error('Periodic sync failed:', err)
      })
    }, 10 * 1000) // 10 seconds

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [sprintId, queryClient])

  return {
    lastSyncedAt,
    isSyncing,
    syncError,
    forceSync,
  }
}

export type UseRealtimeSyncOptions = {
  /** Polling interval in milliseconds (default: 10000 = 10s) */
  pollInterval?: number
}
