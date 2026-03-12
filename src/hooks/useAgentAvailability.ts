/**
 * Agent Availability Hook & Utilities
 *
 * Provides custom hooks for fetching and managing agent availability data,
 * including single-agent and multi-agent queries with conflict detection.
 */

import { useQueries, useQuery } from '@tanstack/react-query'
import type {
  AgentAvailabilityData,
  AvailabilitySlot,
  BatchAvailabilityResponse,
  ConflictEntry,
  ConflictMap,
  DateRange,
} from '../types/agentAvailability'
import type { Task } from '../types/task'

const AVAILABILITY_STALE_TIME = 5 * 60 * 1000 // 5 minutes
const AVAILABILITY_GC_TIME = 10 * 60 * 1000 // 10 minutes

/**
 * Fetch availability data for a single agent
 *
 * Query key: ['agents', agentId, 'availability', { from, to }]
 *
 * @param agentId - The agent ID to fetch availability for
 * @param dateRange - Date range for availability query
 * @returns useQuery result with availability slots normalized by date
 */
export function useAgentAvailability(agentId: string, dateRange: DateRange) {
  const queryKey = ['agents', agentId, 'availability', dateRange] as const

  return useQuery<AgentAvailabilityData>({
    queryKey,
    queryFn: async () => {
      const url = new URL(
        `/api/agents/${agentId}/availability`,
        window.location.origin
      )
      url.searchParams.set('from', dateRange.from)
      url.searchParams.set('to', dateRange.to)

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(
          `Failed to fetch availability for agent ${agentId}: ${response.statusText}`
        )
      }

      const data = (await response.json()) as AvailabilitySlot[]

      // Normalize availability slots by date for easier lookup
      const availabilityByDate: Record<string, AvailabilitySlot> = {}
      data.forEach((slot) => {
        availabilityByDate[slot.date] = slot
      })

      return {
        agentId,
        availabilityByDate,
      }
    },
    staleTime: AVAILABILITY_STALE_TIME,
    gcTime: AVAILABILITY_GC_TIME,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Fetch availability data for multiple agents in parallel
 *
 * Uses TanStack Query's useQueries for efficient parallel fetching.
 *
 * @param agentIds - Array of agent IDs to fetch availability for
 * @param dateRange - Date range for availability queries
 * @returns Array of useQuery results, one per agent
 */
export function useAgentAvailabilityMultiple(
  agentIds: string[],
  dateRange: DateRange
) {
  return useQueries({
    queries: agentIds.map((agentId) => ({
      queryKey: ['agents', agentId, 'availability', dateRange] as const,
      queryFn: async (): Promise<AgentAvailabilityData> => {
        const url = new URL(
          `/api/agents/${agentId}/availability`,
          window.location.origin
        )
        url.searchParams.set('from', dateRange.from)
        url.searchParams.set('to', dateRange.to)

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error(
            `Failed to fetch availability for agent ${agentId}: ${response.statusText}`
          )
        }

        const data = (await response.json()) as AvailabilitySlot[]

        // Normalize availability slots by date
        const availabilityByDate: Record<string, AvailabilitySlot> = {}
        data.forEach((slot) => {
          availabilityByDate[slot.date] = slot
        })

        return {
          agentId,
          availabilityByDate,
        }
      },
      staleTime: AVAILABILITY_STALE_TIME,
      gcTime: AVAILABILITY_GC_TIME,
      retry: 3,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    })),
  })
}

/**
 * Detect conflicts between tasks and agent availability
 *
 * Identifies dates where agents have tasks assigned but are marked as unavailable,
 * or where task count exceeds reasonable capacity.
 *
 * @param tasks - Array of tasks with deadline information
 * @param availabilityData - Normalized availability data for agents
 * @returns ConflictMap with identified conflicts organized by agent and date
 */
export function detectConflicts(
  tasks: Task[],
  availabilityData: AgentAvailabilityData[]
): ConflictMap {
  const conflicts: ConflictEntry[] = []
  const conflictsByAgent: Record<string, ConflictEntry[]> = {}
  const conflictsByDate: Record<string, ConflictEntry[]> = {}

  // Build a map of availability data for quick lookup
  const availabilityMap: Record<string, AgentAvailabilityData> = {}
  availabilityData.forEach((data) => {
    availabilityMap[data.agentId] = data
  })

  // Check each task for conflicts
  tasks.forEach((task) => {
    const agentId = task.assignee
    if (!agentId) return

    const availability = availabilityMap[agentId]
    if (!availability) return

    // Extract deadline date (YYYY-MM-DD format)
    const deadline = task.deadline
    if (!deadline) return

    const deadlineDate = deadline.split('T')[0] // Extract date part

    const slot = availability.availabilityByDate[deadlineDate]
    if (!slot) return

    // Conflict if agent is unavailable on deadline
    if (!slot.isAvailable) {
      const conflict: ConflictEntry = {
        taskId: task.id,
        agentId,
        date: deadlineDate,
        reason: `Agent unavailable: ${slot.reason || 'scheduled off'}`,
      }

      conflicts.push(conflict)

      // Index by agent
      if (!conflictsByAgent[agentId]) {
        conflictsByAgent[agentId] = []
      }
      conflictsByAgent[agentId].push(conflict)

      // Index by date
      if (!conflictsByDate[deadlineDate]) {
        conflictsByDate[deadlineDate] = []
      }
      conflictsByDate[deadlineDate].push(conflict)
    }

    // Check if task count exceeds reasonable threshold (> 5 tasks per day)
    if (slot.taskCount > 5) {
      const conflict: ConflictEntry = {
        taskId: task.id,
        agentId,
        date: deadlineDate,
        reason: `Overbooked: ${slot.taskCount} tasks scheduled`,
      }

      // Only add if not already added for availability conflict
      if (!conflicts.some((c) => c.taskId === task.id && c.agentId === agentId)) {
        conflicts.push(conflict)

        if (!conflictsByAgent[agentId]) {
          conflictsByAgent[agentId] = []
        }
        conflictsByAgent[agentId].push(conflict)

        if (!conflictsByDate[deadlineDate]) {
          conflictsByDate[deadlineDate] = []
        }
        conflictsByDate[deadlineDate].push(conflict)
      }
    }
  })

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    conflictsByAgent,
    conflictsByDate,
  }
}
