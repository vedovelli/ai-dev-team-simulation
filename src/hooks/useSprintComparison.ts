import { useQuery } from '@tanstack/react-query'
import type { SprintComparisonResult } from '../types/sprint-comparison'

interface UseSprintComparisonOptions {
  enabled?: boolean
}

/**
 * Hook for fetching and comparing current sprint vs previous sprint metrics
 *
 * @param sprintId - The current sprint ID to fetch comparison for
 * @param options - React Query options
 * @returns Sprint comparison data with deltas and trend indicators
 */
export function useSprintComparison(
  sprintId: string | undefined,
  options?: UseSprintComparisonOptions
) {
  const { enabled = true } = options || {}

  return useQuery({
    queryKey: ['sprints', sprintId, 'comparison'],
    queryFn: async () => {
      if (!sprintId) {
        throw new Error('Sprint ID is required')
      }

      const response = await fetch(`/api/sprints/${sprintId}/comparison`)

      if (!response.ok) {
        throw new Error('Failed to fetch sprint comparison data')
      }

      return response.json() as Promise<SprintComparisonResult>
    },
    enabled: enabled && !!sprintId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
