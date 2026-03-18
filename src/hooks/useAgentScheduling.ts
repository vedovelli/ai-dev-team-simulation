/**
 * useAgentScheduling - Agent Availability & Scheduling Hook
 *
 * Manages agent availability windows (recurring weekly patterns) and blackout
 * periods using TanStack Query for data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AgentScheduling,
  AvailabilityWindow,
  BlackoutPeriod,
  AgentSchedulingResponse,
} from '../types/agent-scheduling'
import { useMutationWithRetry } from './useMutationWithRetry'

/**
 * Fetch agent scheduling data (availability windows + blackout periods)
 */
export function useAgentScheduling(agentId: string) {
  const queryClient = useQueryClient()

  /**
   * Fetch scheduling data from API
   */
  const query = useQuery<AgentSchedulingResponse, Error>({
    queryKey: ['agents', agentId, 'scheduling'],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/scheduling`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agent scheduling: ${response.statusText}`)
      }

      return response.json() as Promise<AgentSchedulingResponse>
    },
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  /**
   * Mutation to update availability windows
   */
  const updateWindowsMutation = useMutationWithRetry<
    AgentScheduling,
    { availabilityWindows: AvailabilityWindow[] }
  >({
    mutationFn: async ({ availabilityWindows }) => {
      const response = await fetch(`/api/agents/${agentId}/scheduling/availability-windows`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityWindows }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update availability windows: ${response.statusText}`)
      }

      return response.json() as Promise<AgentScheduling>
    },
    onMutate: async ({ availabilityWindows }) => {
      // Cancel pending queries
      await queryClient.cancelQueries({
        queryKey: ['agents', agentId, 'scheduling'],
      })

      // Snapshot previous data
      const previousData = queryClient.getQueryData<AgentScheduling>({
        queryKey: ['agents', agentId, 'scheduling'],
      })

      // Optimistically update
      if (previousData) {
        const updated = { ...previousData, availabilityWindows }
        queryClient.setQueryData(['agents', agentId, 'scheduling'], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousData) {
        queryClient.setQueryData(['agents', agentId, 'scheduling'], context.previousData)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['agents', agentId, 'scheduling'], data)
    },
  })

  /**
   * Mutation to add a blackout period
   */
  const addBlackoutMutation = useMutationWithRetry<
    AgentScheduling,
    { blackoutPeriod: BlackoutPeriod }
  >({
    mutationFn: async ({ blackoutPeriod }) => {
      const response = await fetch(`/api/agents/${agentId}/scheduling/blackouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blackoutPeriod }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add blackout period: ${response.statusText}`)
      }

      return response.json() as Promise<AgentScheduling>
    },
    onMutate: async ({ blackoutPeriod }) => {
      await queryClient.cancelQueries({
        queryKey: ['agents', agentId, 'scheduling'],
      })

      const previousData = queryClient.getQueryData<AgentScheduling>({
        queryKey: ['agents', agentId, 'scheduling'],
      })

      if (previousData) {
        const updated = {
          ...previousData,
          blackoutPeriods: [...previousData.blackoutPeriods, blackoutPeriod].sort((a, b) =>
            a.startDate.localeCompare(b.startDate)
          ),
        }
        queryClient.setQueryData(['agents', agentId, 'scheduling'], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['agents', agentId, 'scheduling'], context.previousData)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['agents', agentId, 'scheduling'], data)
    },
  })

  /**
   * Mutation to delete a blackout period
   */
  const deleteBlackoutMutation = useMutationWithRetry<
    AgentScheduling,
    { startDate: string; endDate: string }
  >({
    mutationFn: async ({ startDate, endDate }) => {
      const response = await fetch(`/api/agents/${agentId}/scheduling/blackouts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete blackout period: ${response.statusText}`)
      }

      return response.json() as Promise<AgentScheduling>
    },
    onMutate: async ({ startDate, endDate }) => {
      await queryClient.cancelQueries({
        queryKey: ['agents', agentId, 'scheduling'],
      })

      const previousData = queryClient.getQueryData<AgentScheduling>({
        queryKey: ['agents', agentId, 'scheduling'],
      })

      if (previousData) {
        const updated = {
          ...previousData,
          blackoutPeriods: previousData.blackoutPeriods.filter(
            (bp) => !(bp.startDate === startDate && bp.endDate === endDate)
          ),
        }
        queryClient.setQueryData(['agents', agentId, 'scheduling'], updated)
      }

      return { previousData }
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['agents', agentId, 'scheduling'], context.previousData)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['agents', agentId, 'scheduling'], data)
    },
  })

  return {
    // Query state
    ...query,

    // Data
    scheduling: query.data,
    availabilityWindows: query.data?.availabilityWindows ?? [],
    blackoutPeriods: query.data?.blackoutPeriods ?? [],

    // Update windows
    updateAvailabilityWindows: (windows: AvailabilityWindow[]) => {
      updateWindowsMutation.mutate({ availabilityWindows: windows })
    },
    updateWindowsLoading: updateWindowsMutation.isLoading,
    updateWindowsError: updateWindowsMutation.error,

    // Add blackout
    addBlackoutPeriod: (period: BlackoutPeriod) => {
      addBlackoutMutation.mutate({ blackoutPeriod: period })
    },
    addBlackoutLoading: addBlackoutMutation.isLoading,
    addBlackoutError: addBlackoutMutation.error,

    // Delete blackout
    deleteBlackoutPeriod: (startDate: string, endDate: string) => {
      deleteBlackoutMutation.mutate({ startDate, endDate })
    },
    deleteBlackoutLoading: deleteBlackoutMutation.isLoading,
    deleteBlackoutError: deleteBlackoutMutation.error,
  }
}

export type UseAgentSchedulingReturn = ReturnType<typeof useAgentScheduling>
