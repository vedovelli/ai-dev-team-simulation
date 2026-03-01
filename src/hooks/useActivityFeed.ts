import { useQuery } from '@tanstack/react-query'
import type { Activity } from '../types/activity'

interface ActivitiesResponse {
  data: Activity[]
  total: number
  pageIndex: number
  pageSize: number
}

export function useActivityFeed(pageIndex: number = 0, pageSize: number = 20) {
  const queryKey = ['activities', pageIndex, pageSize]

  return useQuery<Activity[]>({
    queryKey,
    queryFn: async () => {
      const url = new URL('/api/activities', window.location.origin)
      url.searchParams.set('pageIndex', pageIndex.toString())
      url.searchParams.set('pageSize', pageSize.toString())

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      const result = (await response.json()) as ActivitiesResponse
      return result.data
    },
    staleTime: 5000,
  })
}
