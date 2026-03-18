/**
 * useSprintRetrospective Hook
 *
 * Fetches and manages sprint retrospective data using TanStack Query.
 * Provides comprehensive analytics for velocity trends, burndown analysis,
 * and team performance metrics across multiple sprints.
 *
 * Features:
 * - Multi-endpoint aggregation via sequential queries
 * - 5min stale time with 10min garbage collection
 * - Automatic refetch on window focus
 * - Exponential backoff retry (3 attempts)
 * - Type-safe data access with computed values
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SprintRetrospectiveData, HistoricalSprintData } from '../types/sprint-retrospective'

/**
 * Configuration options for useSprintRetrospective hook
 */
export interface UseSprintRetrospectiveOptions {
  /** Enable automatic refetch on window focus (default: true) */
  refetchOnWindowFocus?: boolean
  /** Enable automatic refetch when connection is restored (default: true) */
  refetchOnReconnect?: boolean
}

/**
 * Fetch sprint retrospective data
 */
async function fetchSprintRetrospective(sprintId: string): Promise<SprintRetrospectiveData> {
  const response = await fetch(`/api/sprints/${sprintId}/retrospective`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sprint retrospective: ${response.status} ${response.statusText}`
    )
  }

  return response.json() as Promise<SprintRetrospectiveData>
}

/**
 * Fetch historical sprint data (last 6 months)
 */
async function fetchHistoricalSprints(): Promise<HistoricalSprintData[]> {
  const response = await fetch('/api/sprints/retrospective/historical', {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch historical sprints: ${response.status} ${response.statusText}`
    )
  }

  return response.json() as Promise<HistoricalSprintData[]>
}

/**
 * Use sprint retrospective data with automatic multi-endpoint aggregation
 *
 * @param sprintId - The sprint ID to fetch retrospective data for
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const {
 *   isLoading,
 *   error,
 *   data: retrospectiveData,
 *   refetch,
 * } = useSprintRetrospective('sprint-1')
 *
 * if (isLoading) return <Spinner />
 * if (error) return <ErrorMessage error={error} />
 *
 * return (
 *   <div>
 *     <h2>{retrospectiveData?.sprintName}</h2>
 *     <VelocityChart data={retrospectiveData?.velocityTrend.chartData} />
 *     <BurndownChart data={retrospectiveData?.burndownAnalysis.chartData} />
 *   </div>
 * )
 * ```
 */
export function useSprintRetrospective(
  sprintId: string,
  options: UseSprintRetrospectiveOptions = {}
) {
  const {
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
  } = options

  // Main query for sprint retrospective data
  const query = useQuery<SprintRetrospectiveData, Error>({
    queryKey: ['sprints', sprintId, 'retrospective'],
    queryFn: () => fetchSprintRetrospective(sprintId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus,
    refetchOnReconnect,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Optional: fetch historical data for context
  const historicalQuery = useQuery<HistoricalSprintData[], Error>({
    queryKey: ['sprints', 'retrospective', 'historical'],
    queryFn: fetchHistoricalSprints,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus,
    refetchOnReconnect,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    // Query state
    isLoading: query.isLoading || historicalQuery.isLoading,
    isFetching: query.isFetching || historicalQuery.isFetching,
    error: query.error || historicalQuery.error,
    status: query.status === 'pending' || historicalQuery.status === 'pending' ? 'pending' : query.status,

    // Data
    retrospectiveData: query.data,
    historicalSprints: historicalQuery.data,

    // Computed values
    sprintName: query.data?.sprintName,
    healthScore: query.data?.summary.healthScore,
    velocityTrend: query.data?.velocityTrend,
    burndownAnalysis: query.data?.burndownAnalysis,
    teamPerformance: query.data?.teamPerformance,
    summary: query.data?.summary,

    // Actions
    refetch: async () => {
      await Promise.all([query.refetch(), historicalQuery.refetch()])
    },
  }
}

export type UseSprintRetrospectiveReturn = ReturnType<typeof useSprintRetrospective>
