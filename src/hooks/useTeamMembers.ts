import { useQuery } from '@tanstack/react-query'

export interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
}

const TEAM_MEMBERS_QUERY_KEY = ['teamMembers']

async function fetchTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch('/api/team-members')
  if (!response.ok) {
    throw new Error('Failed to fetch team members')
  }
  return response.json()
}

export function useTeamMembers() {
  return useQuery({
    queryKey: TEAM_MEMBERS_QUERY_KEY,
    queryFn: fetchTeamMembers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
