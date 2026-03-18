import { useQuery } from '@tanstack/react-query'
import type { Task } from '../types/task'
import { usePollingWithFocus } from './usePollingWithFocus'

/**
 * Fetch agent tasks with real-time polling and sync state exposure
 *
 * Features:
 * - Automatic polling every 30 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy for better UX
 * - Expose polling state: isFetching, isStale, syncStatus
 * - Includes error handling and retry logic with exponential backoff
 */
export interface UseAgentTasksOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch (default: true) */
  refetchOnWindowFocus?: boolean
}

export interface AgentTasksResponse {
  data: Task[]
  totalCount: number
}

export function useAgentTasks(agentId: string, options: UseAgentTasksOptions = {}) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
  } = options

  // Use polling hook to pause polling when window is hidden
  const polling = usePollingWithFocus({ interval: refetchInterval, enabled: !!agentId })

  const query = useQuery<AgentTasksResponse, Error>({
    queryKey: ['agents', agentId, 'tasks'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/tasks`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agent tasks: ${response.statusText}`)
      }
      return response.json() as Promise<AgentTasksResponse>
    },
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    ...polling, // Spread polling configuration (includes refetchInterval that pauses when unfocused)
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Compute sync status from isFetching and isStale
  type SyncStatus = 'idle' | 'syncing' | 'stale'
  const syncStatus: SyncStatus = query.isFetching
    ? 'syncing'
    : query.isStale
      ? 'stale'
      : 'idle'

  return {
    ...query,
    tasks: query.data?.data ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isFetching: query.isFetching,
    isStale: query.isStale,
    syncStatus,
  }
}
