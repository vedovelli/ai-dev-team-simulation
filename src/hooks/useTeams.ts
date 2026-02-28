import { useQuery } from '@tanstack/react-query'

export interface Team {
  id: string
  name: string
  status: 'active' | 'inactive'
  members: number
  createdAt: string
}

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      return response.json()
    },
  })
}
