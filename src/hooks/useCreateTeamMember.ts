import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TeamMember, CreateTeamMemberInput } from '../types/team'

const TEAM_MEMBERS_QUERY_KEY = ['team-members']

export function useCreateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTeamMemberInput) => {
      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error('Failed to create team member')
      }

      return response.json() as Promise<TeamMember>
    },

    onMutate: async (newMember) => {
      // Cancel any ongoing queries for team-members
      await queryClient.cancelQueries({ queryKey: TEAM_MEMBERS_QUERY_KEY })

      // Get previous data
      const previousMembers = queryClient.getQueryData<TeamMember[]>(
        TEAM_MEMBERS_QUERY_KEY,
      )

      // Create optimistic member (without real ID, will be replaced on success)
      const optimisticMember: TeamMember = {
        id: `temp-${Date.now()}`,
        ...newMember,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
      }

      // Update cache optimistically
      queryClient.setQueryData<TeamMember[]>(
        TEAM_MEMBERS_QUERY_KEY,
        (old) => (old ? [...old, optimisticMember] : [optimisticMember]),
      )

      return { previousMembers }
    },

    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: TEAM_MEMBERS_QUERY_KEY })
    },

    onError: (error, variables, context) => {
      // Revert to previous state on error
      if (context?.previousMembers) {
        queryClient.setQueryData(TEAM_MEMBERS_QUERY_KEY, context.previousMembers)
      }
    },
  })
}
