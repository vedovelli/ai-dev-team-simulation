import { useQuery } from '@tanstack/react-query'
import type { Sprint } from '../types/sprint'

interface SprintSummary {
  sprintId: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  remainingTasks: number
  completionPercentage: number
}

interface TasksByStatus {
  backlog: Array<{ id: string; title: string; assignee: string; priority: string }>
  'in-progress': Array<{ id: string; title: string; assignee: string; priority: string }>
  'in-review': Array<{ id: string; title: string; assignee: string; priority: string }>
  done: Array<{ id: string; title: string; assignee: string; priority: string }>
}

interface AgentWorkload {
  agent: string
  taskCount: number
  completedCount: number
}

interface SprintDashboardData {
  sprint: Sprint
  summary: SprintSummary
  tasksByStatus: TasksByStatus
  agentWorkload: AgentWorkload[]
}

/**
 * Custom hook that encapsulates sprint context and data fetching.
 * Fetches sprint details along with summary stats, tasks by status, and agent workload.
 */
export function useSprint(sprintId: string) {
  // Fetch sprint details
  const sprintQuery = useQuery<Sprint, Error>({
    queryKey: ['sprint', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}`)
      if (!response.ok) throw new Error('Failed to fetch sprint')
      return response.json()
    },
    enabled: !!sprintId,
  })

  // Fetch sprint summary
  const summaryQuery = useQuery<SprintSummary, Error>({
    queryKey: ['sprintSummary', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/summary`)
      if (!response.ok) throw new Error('Failed to fetch sprint summary')
      return response.json()
    },
    enabled: !!sprintId,
  })

  // Fetch tasks by status
  const tasksByStatusQuery = useQuery<TasksByStatus, Error>({
    queryKey: ['sprintTasksByStatus', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/tasks/summary`)
      if (!response.ok) throw new Error('Failed to fetch tasks by status')
      return response.json()
    },
    enabled: !!sprintId,
  })

  // Fetch agent workload
  const workloadQuery = useQuery<AgentWorkload[], Error>({
    queryKey: ['sprintAgentWorkload', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/agents/workload`)
      if (!response.ok) throw new Error('Failed to fetch agent workload')
      return response.json()
    },
    enabled: !!sprintId,
  })

  // Combine all queries into a single data object
  const isLoading = sprintQuery.isLoading || summaryQuery.isLoading || tasksByStatusQuery.isLoading || workloadQuery.isLoading
  const error = sprintQuery.error || summaryQuery.error || tasksByStatusQuery.error || workloadQuery.error

  const data: SprintDashboardData | undefined =
    sprintQuery.data && summaryQuery.data && tasksByStatusQuery.data && workloadQuery.data
      ? {
          sprint: sprintQuery.data,
          summary: summaryQuery.data,
          tasksByStatus: tasksByStatusQuery.data,
          agentWorkload: workloadQuery.data,
        }
      : undefined

  return {
    data,
    isLoading,
    error,
  }
}
