import { useQuery } from '@tanstack/react-query'

export interface WorkloadAnalytics {
  agentId: string
  name: string
  activeTasksCount: number
  completedTasks: number
  averageCompletionTime: number
  capacityUtilization: number
  skillTags: string[]
  completionTrend: number // 7-day trend percentage
  status: 'available' | 'busy' | 'overloaded'
}

export interface WorkloadAnalyticsFilters {
  timeframe?: '7d' | '30d'
  skillTag?: string
  project?: string
  status?: 'available' | 'busy' | 'overloaded'
}

/**
 * Fetch workload analytics for all agents
 * Aggregates active tasks, completion rates, and capacity utilization
 */
export function useWorkloadAnalytics(filters: WorkloadAnalyticsFilters = {}) {
  const timeframe = filters.timeframe || '7d'

  const query = useQuery({
    queryKey: ['agents', 'workload', { timeframe, ...filters }],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        ...(filters.skillTag && { skillTag: filters.skillTag }),
        ...(filters.project && { project: filters.project }),
        ...(filters.status && { status: filters.status }),
      })

      const response = await fetch(`/api/agents/workload?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workload analytics')
      }
      return response.json() as Promise<WorkloadAnalytics[]>
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return query
}

/**
 * Get single agent workload analytics
 */
export function useAgentWorkloadAnalytics(agentId: string) {
  const query = useQuery({
    queryKey: ['agents', 'workload', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/workload`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent workload')
      }
      return response.json() as Promise<WorkloadAnalytics>
    },
    enabled: !!agentId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  return query
}
