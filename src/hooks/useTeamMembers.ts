import { useQuery } from '@tanstack/react-query'
import type { TeamMembersResponse } from '../types/team'

export function useTeamMembers() {
  return useQuery<TeamMembersResponse>({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      const response = await fetch('/api/team-members')
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      return response.json()
    },
  })
}
