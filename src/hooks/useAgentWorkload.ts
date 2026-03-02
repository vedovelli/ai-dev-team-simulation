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

export function useAgentWorkload(agentId: string) {
  return useQuery({
    queryKey: ['agent-workload', agentId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/workload`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent workload')
      }
      return response.json() as Promise<WorkloadData>
    },
  })
}
