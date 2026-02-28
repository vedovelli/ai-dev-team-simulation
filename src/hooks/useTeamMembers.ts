import { useQuery } from '@tanstack/react-query'
import type { TeamMember } from '../types/team'

export function useTeamMembers() {
  return useQuery<TeamMember[], Error>({
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
