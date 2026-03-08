import { useQuery } from '@tanstack/react-query'
import type { TaskDistributionResponse, AnalyticsFilters } from '../types/analytics'

interface UseTaskDistributionOptions extends AnalyticsFilters {
  page?: number
  pageSize?: number
  sortBy?: 'priority' | 'status' | 'agent' | 'duration' | 'completedAt'
  sortOrder?: 'asc' | 'desc'
}

export function useTaskDistribution(options: UseTaskDistributionOptions) {
  const { page = 1, pageSize = 50, sortBy = 'completedAt', sortOrder = 'desc' } = options

  const query = useQuery<TaskDistributionResponse>({
    queryKey: [
      'analytics',
      'tasks',
      'distribution',
      options.timeRange,
      page,
      pageSize,
      sortBy,
      sortOrder,
      options.priority,
      options.status,
      options.agentId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange: options.timeRange,
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
        ...(options.priority && { priority: options.priority }),
        ...(options.status && { status: options.status }),
        ...(options.agentId && { agentId: options.agentId }),
      })
      const response = await fetch(`/api/analytics/tasks/distribution?${params}`)
      if (!response.ok) throw new Error('Failed to fetch task distribution data')
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
