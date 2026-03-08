import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { AgentSettings } from '../../lib/validation'

/**
 * Fetch agent settings (task priority filter, auto-assignment, notifications)
 *
 * Features:
 * - Fetches current agent configuration
 * - Enabled only when agentId is provided
 * - Stale-while-revalidate strategy
 * - Exponential backoff retry on failure
 *
 * Query key structure: ['agents', agentId, 'settings']
 */
export function useAgentSettings(agentId?: string) {
  const queryClient = useQueryClient()

  // Cancel pending requests when agentId becomes undefined
  useEffect(() => {
    if (!agentId) {
      queryClient.cancelQueries({ queryKey: ['agents', agentId, 'settings'] })
    }
  }, [agentId, queryClient])

  return useQuery<AgentSettings, Error>({
    queryKey: ['agents', agentId, 'settings'],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID is required')

      const response = await fetch(`/api/agents/${agentId}/settings`)
      if (!response.ok) {
        throw new Error(`Failed to fetch agent settings: ${response.statusText}`)
      }

      return response.json() as Promise<AgentSettings>
    },
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
