/**
 * Task Monitoring Hook
 *
 * Provides real-time polling of task status with smart refetch intervals
 * and comprehensive error handling.
 *
 * Features:
 * - Smart polling with configurable intervals
 * - Real-time progress updates
 * - Error state management with retry logic
 * - Task filtering support
 *
 * @example
 * ```tsx
 * const { tasks, isLoading, error, retry } = useTaskMonitor({
 *   pollIntervalMs: 5000,
 *   statusFilter: 'in-progress',
 * })
 * ```
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { Task } from '@/types/task'
import type { ExtendedQueryOptions } from '@/types/query'

interface TaskMonitorConfig {
  /** Poll interval in milliseconds (default: 5000) */
  pollIntervalMs?: number
  /** Filter tasks by status */
  statusFilter?: Task['status'] | null
  /** Filter tasks by team */
  teamFilter?: string | null
  /** Filter tasks by assignee */
  assigneeFilter?: string | null
  /** Enable polling (default: true) */
  enabled?: boolean
}

interface TaskMonitorResult extends UseQueryResult<Task[], Error> {
  /** Manual retry function */
  retry: () => void
  /** Number of retry attempts */
  retryCount: number
  /** Whether the error is recoverable */
  isRecoverable: boolean
  /** Number of tasks being monitored */
  taskCount: number
}

/**
 * Hook for monitoring task execution with polling and error handling
 *
 * @param config - Configuration for task monitoring
 * @returns Task monitoring result with data and status
 */
export function useTaskMonitor(config: TaskMonitorConfig = {}): TaskMonitorResult {
  const {
    pollIntervalMs = 5000,
    statusFilter = null,
    teamFilter = null,
    assigneeFilter = null,
    enabled = true,
  } = config

  // Build query key with filters
  const queryKey = [
    'task-monitor',
    {
      statusFilter,
      teamFilter,
      assigneeFilter,
    },
  ] as const

  // Build URL with query params
  const buildUrl = (): string => {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (teamFilter) params.append('team', teamFilter)
    if (assigneeFilter) params.append('assignee', assigneeFilter)

    const queryString = params.toString()
    return queryString ? `/api/task-monitor?${queryString}` : '/api/task-monitor'
  }

  // Query function with error handling
  const queryFn = async (): Promise<Task[]> => {
    const response = await fetch(buildUrl())
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to fetch tasks: ${response.status}`)
    }
    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  }

  // Retry configuration with exponential backoff
  const maxRetries = 3
  const initialDelayMs = 1000

  const calculateRetryDelay = (attemptIndex: number): number => {
    return Math.min(initialDelayMs * Math.pow(2, attemptIndex), 30000)
  }

  const isRetriableError = (error: unknown): boolean => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      // Retry on network and server errors, but not client errors
      return (
        message.includes('failed to fetch') ||
        message.includes('fetch') ||
        message.includes('5')
      )
    }
    return false
  }

  const manualRetry = useCallback(() => {
    query.refetch()
  }, [query])

  const query = useQuery<Task[], Error>({
    queryKey: queryKey,
    queryFn,
    refetchInterval: enabled ? pollIntervalMs : false,
    refetchIntervalInBackground: enabled,
    enabled,
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) return false
      return isRetriableError(error)
    },
    retryDelay: (attemptIndex) => calculateRetryDelay(attemptIndex),
    staleTime: 1000, // Stale after 1 second
    gcTime: 5 * 60 * 1000, // Garbage collection after 5 minutes
  })

  const isRecoverable = query.failureCount < maxRetries && query.isError

  return {
    ...query,
    retry: manualRetry,
    retryCount: query.failureCount,
    isRecoverable,
    taskCount: query.data?.length || 0,
  }
}
