import { useQuery } from '@tanstack/react-query'
import type { AgentManagement } from '../types/agent'

/**
 * Filters for the useAgents hook
 * Supports search by name/capabilities, status filtering, and sorting
 */
export interface UseAgentsFilters {
  search?: string
  status?: 'active' | 'idle' | 'busy' | 'offline'
  sortBy?: 'name' | 'status' | 'taskCount' | 'successRate' | 'createdAt' | 'updatedAt'
  order?: 'asc' | 'desc'
}

/**
 * Options for controlling polling behavior
 */
export interface UseAgentsOptions {
  /** Refetch interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
  /** Enable automatic refetch (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Fetch all agents with real-time polling support
 *
 * Features:
 * - Automatic polling every 30 seconds (configurable)
 * - Refetch on window focus for fresh data
 * - Stale-while-revalidate strategy
 * - Query support: search, status, sortBy, order
 * - Exponential backoff retry on failure
 *
 * Query key structure: ['agents'] or ['agents', filters]
 */
export function useAgents(
  filters?: UseAgentsFilters,
  options: UseAgentsOptions = {}
) {
  const {
    refetchInterval = 30 * 1000, // 30 seconds
    refetchOnWindowFocus = true,
  } = options

  const queryKey = filters ? ['agents', filters] : ['agents']

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/agents', window.location.origin)

      if (filters?.search) {
        url.searchParams.set('search', filters.search)
      }
      if (filters?.status) {
        url.searchParams.set('status', filters.status)
      }
      if (filters?.sortBy) {
        url.searchParams.set('sortBy', filters.sortBy)
      }
      if (filters?.order) {
        url.searchParams.set('order', filters.order)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`)
      }

      const data = await response.json() as { agents: AgentManagement[]; total: number }
      return data.agents
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    refetchInterval, // Polling configuration
    refetchOnWindowFocus, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}
