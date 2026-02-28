import { useQuery } from '@tanstack/react-query'
import type { TeamMember } from '../types'

export function useTeamMember(memberId: string) {
  return useQuery({
    queryKey: ['teamMember', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/team-members/${memberId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch team member')
      }
      return response.json() as Promise<TeamMember>
    },
  })
}
