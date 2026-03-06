import { useQuery } from '@tanstack/react-query'
import type { AgentMetrics } from '../types/metrics'

export type TimeRange = '24h' | '7d' | '30d' | 'all-time'

interface UseAgentMetricsOptions {
  timeRange?: TimeRange
}

export function useAgentMetrics({ timeRange = '24h' }: UseAgentMetricsOptions = {}) {
  return useQuery({
    queryKey: ['agent-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch('/api/agents/performance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agent metrics: ${response.statusText}`)
      }

      const data = (await response.json()) as AgentMetrics[]

      // Filter and sort by metrics
      return data.sort((a, b) => b.completionRate - a.completionRate)
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: true,
  })
}
