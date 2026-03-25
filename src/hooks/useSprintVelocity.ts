import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { SprintVelocityRaw, VelocityDataPoint, SprintVelocityResponse } from '../types/sprint'

/**
 * Options for the useSprintVelocity hook
 */
export interface UseSprintVelocityOptions {
  /** Number of past sprints to fetch (default: 5, max: 10) */
  last?: number
}

/**
 * Return type for useSprintVelocity hook
 */
export interface UseSprintVelocityReturn extends Omit<UseQueryResult<SprintVelocityResponse, Error>, 'data'> {
  data: SprintVelocityResponse | null
}

/**
 * Transform raw API response to chart-ready data
 */
function transformVelocityData(raw: SprintVelocityRaw[]): SprintVelocityResponse {
  // Transform to chart data points
  const data: VelocityDataPoint[] = raw.map((sprint) => ({
    name: sprint.sprintName,
    planned: sprint.plannedPoints,
    completed: sprint.completedPoints,
    completionRate: sprint.plannedPoints > 0
      ? Math.round((sprint.completedPoints / sprint.plannedPoints) * 100)
      : 0,
  }))

  // Calculate rolling average of last 3 sprints
  let rollingAverage = 0
  const lastThree = data.slice(-3)
  if (lastThree.length > 0) {
    const sum = lastThree.reduce((acc, point) => acc + point.completed, 0)
    rollingAverage = Math.round(sum / lastThree.length)
  }

  return {
    data,
    rollingAverage,
  }
}

/**
 * Fetch historical sprint velocity trends with TanStack Query
 *
 * Features:
 * - Configurable number of past sprints (default 5, max 10)
 * - Transforms raw API data into chart-ready format
 * - Computes rolling average (last 3 sprints)
 * - Stale time: 5 minutes (velocity rarely changes mid-sprint)
 * - Exponential backoff retry (3 attempts)
 * - Full TypeScript support with generics
 */
export function useSprintVelocity(options: UseSprintVelocityOptions = {}): UseSprintVelocityReturn {
  const { last = 5 } = options

  // Validate and clamp last parameter
  const validatedLast = Math.min(10, Math.max(1, last))

  const query = useQuery<SprintVelocityRaw[], Error, SprintVelocityResponse>({
    queryKey: ['sprints', 'velocity', validatedLast],
    queryFn: async () => {
      const url = new URL('/api/sprints/velocity', window.location.origin)
      url.searchParams.set('last', validatedLast.toString())

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Failed to fetch sprint velocity: ${response.statusText}`)
      }
      return response.json() as Promise<SprintVelocityRaw[]>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    select: transformVelocityData, // Transform data on successful fetch
  })

  return {
    ...query,
    data: query.data ?? null,
  }
}
