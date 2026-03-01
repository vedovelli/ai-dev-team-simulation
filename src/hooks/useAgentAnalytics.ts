import { useQuery } from '@tanstack/react-query'

export interface AgentMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  inProgressTasks: number
  completionRate: string
  averageTimeToComplete: number
  errorRate: string
}

export interface AgentAnalyticsResponse {
  agentId: string
  agentName: string
  agentRole: string
  metrics: AgentMetrics
}

export function useAgentAnalytics(agentId: string) {
  return useQuery<AgentAnalyticsResponse, Error>({
    queryKey: ['agentAnalytics', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/analytics`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent analytics')
      }
      return response.json()
    },
    enabled: !!agentId,
  })
}
