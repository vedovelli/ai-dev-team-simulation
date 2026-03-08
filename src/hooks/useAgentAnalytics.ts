import { useQuery } from '@tanstack/react-query'
import type { AgentMetrics, TimeSeriesDataPoint } from '../types/metrics'

export interface AgentAnalyticsData {
  metrics: AgentMetrics[]
  trendData: TimeSeriesDataPoint[]
  timeRange: '7d' | '30d' | '90d'
}

/**
 * Fetch agent performance analytics for a specific time range
 * Supports 7, 30, and 90 day views with trend data
 *
 * Query key: ['agents', 'analytics', timeRange]
 */
export function useAgentAnalytics(timeRange: '7d' | '30d' | '90d' = '7d') {
  const query = useQuery({
    queryKey: ['agents', 'analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/agents/analytics?timeRange=${timeRange}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch agent analytics')
      }
      return response.json() as Promise<AgentAnalyticsData>
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return query
}

/**
 * Fetch analytics for a single agent across all time ranges
 * Used by agent detail views
 */
export function useAgentSingleAnalytics(
  agentId: string,
  timeRange: '7d' | '30d' | '90d' = '7d'
) {
  const query = useQuery({
    queryKey: ['agents', agentId, 'analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/agents/${agentId}/analytics?timeRange=${timeRange}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch agent analytics')
      }
      return response.json() as Promise<AgentAnalyticsData>
    },
    enabled: !!agentId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  return query
}
