import { useQuery } from '@tanstack/react-query'
import type { TimeSeriesDataPoint } from '../types/analytics'

interface UseAgentUtilizationDataOptions {
  timeRange: '7d' | '30d' | '90d' | 'all'
  granularity?: 'daily' | 'weekly'
}

export function useAgentUtilizationData(options: UseAgentUtilizationDataOptions) {
  const query = useQuery<TimeSeriesDataPoint[]>({
    queryKey: ['analytics', 'agents', 'utilization', options.timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: options.timeRange,
        ...(options.granularity && { granularity: options.granularity }),
      })
      const response = await fetch(`/api/analytics/agents/utilization?${params}`)
      if (!response.ok) throw new Error('Failed to fetch agent utilization data')
      return response.json()
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (index) => Math.min(1000 * 2 ** index, 30000),
  })

  return query
}
