import { useQuery } from '@tanstack/react-query'

export interface WorkloadData {
  agentId: string
  role: string
  status: string
  activeTasksCount: number
  totalEstimatedHours: number
  sprintCapacity: number
  utilizationPercent: number
}

export interface WorkloadMetrics {
  utilization: 'underutilized' | 'balanced' | 'overloaded'
  capacityRemaining: number
  taskThroughput: number
  averageTaskSize: number
}

/**
 * Calculate workload metrics from raw workload data
 * Determines utilization status and capacity insights
 */
function calculateWorkloadMetrics(data: WorkloadData): WorkloadMetrics {
  const utilization = data.utilizationPercent > 90
    ? 'overloaded'
    : data.utilizationPercent < 50
      ? 'underutilized'
      : 'balanced'

  const capacityRemaining = Math.max(0, data.sprintCapacity - data.totalEstimatedHours)
  const taskThroughput = data.activeTasksCount > 0
    ? Math.round((data.totalEstimatedHours / data.activeTasksCount) * 10) / 10
    : 0
  const averageTaskSize = data.activeTasksCount > 0
    ? Math.round((data.totalEstimatedHours / data.activeTasksCount) * 10) / 10
    : 0

  return {
    utilization,
    capacityRemaining,
    taskThroughput,
    averageTaskSize,
  }
}

/**
 * Fetch agent workload data with calculated metrics
 * Uses stale-while-revalidate strategy
 */
export function useAgentWorkload(agentId: string) {
  const query = useQuery({
    queryKey: ['agent-workload', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/workload`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent workload')
      }
      return response.json() as Promise<WorkloadData>
    },
    enabled: !!agentId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
  })

  const metrics = query.data ? calculateWorkloadMetrics(query.data) : null

  return {
    ...query,
    metrics,
  }
}

/**
 * Fetch all agent workloads for a sprint
 * Runs queries in parallel and aggregates results
 */
export function useAgentWorkloadList(agentIds: string[]) {
  return useQuery({
    queryKey: ['agent-workload-list', agentIds],
    queryFn: async () => {
      const response = await fetch('/api/agents/workload')
      if (!response.ok) {
        throw new Error('Failed to fetch agent workloads')
      }
      return response.json() as Promise<WorkloadData[]>
    },
    enabled: agentIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
