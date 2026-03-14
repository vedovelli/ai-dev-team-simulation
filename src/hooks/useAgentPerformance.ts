/**
 * useAgentPerformance Hook
 *
 * Fetches and manages per-agent performance KPIs.
 * Powers sprint dashboard agent cards and workload analysis.
 */

import { useQuery } from '@tanstack/react-query'
import type { AgentPerformance } from '../types/agent-performance'

/**
 * Configuration options for useAgentPerformance hook
 */
export interface UseAgentPerformanceOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
}

/**
 * Fetch agent performance KPIs
 *
 * Features:
 * - Caches performance data with 2min stale time
 * - Exponential backoff retry (3 attempts)
 * - Automatic refetch on window focus
 * - Type-safe KPI object: tasksCompleted, velocity, onTimeRate, avgCompletionDays
 *
 * @param agentId - The agent ID to fetch performance for
 * @param options - Hook configuration
 * @returns Query state with performance data
 */
export function useAgentPerformance(
  agentId: string,
  options: UseAgentPerformanceOptions = {}
) {
  const {
    refetchOnWindowFocus = true,
  } = options

  const query = useQuery<AgentPerformance, Error>({
    queryKey: ['agents', agentId, 'performance'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/performance`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agent performance: ${response.statusText}`)
      }

      return response.json() as Promise<AgentPerformance>
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    // Query state
    ...query,

    // Computed values
    performance: query.data,
  }
}

export type UseAgentPerformanceReturn = ReturnType<typeof useAgentPerformance>
