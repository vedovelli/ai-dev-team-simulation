import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Activity } from '../types/activity'

interface ActivitiesResponse {
  data: Activity[]
  total: number
  pageIndex: number
  pageSize: number
}

export function useActivityFeed(pageIndex: number = 0, pageSize: number = 20): UseQueryResult<Activity[]> {
  // Validate pagination parameters
  if (pageIndex < 0 || pageSize < 1) {
    throw new Error('Invalid pagination: pageIndex must be >= 0 and pageSize must be >= 1')
  }

  const queryKey = ['activities', pageIndex, pageSize]

  return useQuery<Activity[]>({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/activities', window.location.origin)
      url.searchParams.set('pageIndex', pageIndex.toString())
      url.searchParams.set('pageSize', pageSize.toString())

      let response: Response
      try {
        response = await fetch(url.toString())
      } catch (error) {
        throw new Error(
          `Network error fetching activities: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`)
      }

      let result: unknown
      try {
        result = await response.json()
      } catch (error) {
        throw new Error(
          `Invalid response format: ${error instanceof Error ? error.message : 'JSON parse error'}`
        )
      }

      // Validate response shape
      if (!result || typeof result !== 'object' || !('data' in result)) {
        throw new Error('Invalid activities response: missing data field')
      }

      const { data } = result as Record<string, unknown>
      if (!Array.isArray(data)) {
        throw new Error('Invalid activities response: data is not an array')
      }

      return data
    },
    staleTime: 5000,
  })
}
