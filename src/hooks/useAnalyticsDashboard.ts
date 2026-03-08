import { useQuery } from '@tanstack/react-query'
import type { AnalyticsDashboardData, AnalyticsFilters } from '../types/analytics'

export function useAnalyticsDashboard(filters: AnalyticsFilters) {
  const query = useQuery<AnalyticsDashboardData>({
    queryKey: ['analytics', 'dashboard', filters.timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.status && { status: filters.status }),
        ...(filters.agentId && { agentId: filters.agentId }),
      })
      const response = await fetch(`/api/analytics/overview?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics dashboard')
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
