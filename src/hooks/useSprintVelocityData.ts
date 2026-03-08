import { useQuery } from '@tanstack/react-query'
import type { SprintMetric } from '../types/analytics'

interface UseSprintVelocityDataOptions {
  timeRange: '7d' | '30d' | '90d' | 'all'
}

export function useSprintVelocityData(options: UseSprintVelocityDataOptions) {
  const query = useQuery<SprintMetric[]>({
    queryKey: ['analytics', 'sprints', 'velocity', options.timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: options.timeRange,
      })
      const response = await fetch(`/api/analytics/sprints/velocity?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sprint velocity data')
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
