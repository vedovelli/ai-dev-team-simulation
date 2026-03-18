/**
 * Sprint Report Hook
 *
 * Fetches comprehensive sprint performance data using useQueries for parallel
 * loading of report sections. Designed for analytics dashboards.
 *
 * Endpoints:
 * - GET /api/sprints/:id/report - complete report with metrics and trends
 */

import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import type {
  SprintReport,
  AgentPerformance,
  BurndownPoint,
  VelocityPoint,
} from '../types/reports'

export interface UseSprintReportResult {
  report: SprintReport | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const SPRINT_REPORT_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
}

/**
 * Hook for fetching sprint performance reports with parallel sub-queries
 *
 * Uses TanStack Query's useQueries to fetch the full report data.
 * Report includes completion trends, velocity data, agent performance,
 * and burndown metrics for comprehensive analytics.
 *
 * Query key: ['sprints', sprintId, 'report']
 *
 * @param sprintId - The sprint ID to fetch report for
 * @returns Object containing report data and query state
 */
export function useSprintReport(sprintId: string): UseSprintReportResult {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['sprints', sprintId, 'report'],
        queryFn: async () => {
          const response = await fetch(`/api/sprints/${sprintId}/report`)
          if (!response.ok) {
            throw new Error(`Failed to fetch sprint report: ${response.status}`)
          }
          return (await response.json()) as SprintReport
        },
        ...SPRINT_REPORT_CACHE_CONFIG,
      },
    ],
  })

  const reportQuery = queries[0] as UseQueryResult<SprintReport, Error>

  const isLoading = reportQuery.isLoading
  const isError = reportQuery.isError
  const error = reportQuery.error
  const report = reportQuery.data

  const refetch = async () => {
    await reportQuery.refetch()
  }

  return {
    report,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Extract completion rate trend from report
 */
export function useCompletionRateTrend(sprintId: string) {
  const { report, isLoading, error } = useSprintReport(sprintId)
  return {
    trend: report?.completionRateTrend,
    isLoading,
    error,
  }
}

/**
 * Extract velocity trend from report
 */
export function useVelocityTrend(sprintId: string) {
  const { report, isLoading, error } = useSprintReport(sprintId)
  return {
    trend: report?.velocityTrend,
    isLoading,
    error,
  }
}

/**
 * Extract agent performance data from report
 */
export function useAgentPerformanceMetrics(sprintId: string) {
  const { report, isLoading, error } = useSprintReport(sprintId)
  return {
    metrics: report?.agentPerformance,
    isLoading,
    error,
  }
}

/**
 * Extract burndown data from report
 */
export function useBurndownData(sprintId: string) {
  const { report, isLoading, error } = useSprintReport(sprintId)
  return {
    data: report?.burndownData,
    isLoading,
    error,
  }
}
