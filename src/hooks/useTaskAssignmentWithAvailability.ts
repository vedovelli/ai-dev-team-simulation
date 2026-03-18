import { useCallback } from 'react'
import type { AssignTaskVariables } from './useTaskAssignment'
import { useAgentAvailability } from './useAgentAvailability'
import type { DateRange } from '../types/agent-availability'

/**
 * Helper hook that combines task assignment with agent availability checking
 *
 * Provides a method to check if an agent is available when assigning a task with a deadline.
 * This is useful for showing non-blocking warnings to the user before assignment.
 *
 * @param agentId - The agent being assigned the task
 * @param taskDeadline - The task's deadline (ISO date string)
 * @returns Object with methods to check availability
 *
 * @example
 * const { isAvailableOnDeadline, getAvailabilityWarning } = useTaskAssignmentWithAvailability(
 *   'agent-1',
 *   '2024-03-15'
 * )
 *
 * if (!isAvailableOnDeadline) {
 *   showWarning(getAvailabilityWarning())
 * }
 * await assignTask({ taskId, agentId })
 */
export function useTaskAssignmentWithAvailability(
  agentId: string,
  taskDeadline?: string
) {
  // Only fetch availability if we have both agent and deadline
  const dateRange: DateRange | null = taskDeadline
    ? {
        from: new Date(taskDeadline)
          .toISOString()
          .split('T')[0],
        to: new Date(new Date(taskDeadline).getTime() + 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      }
    : null

  const { data: availability, isLoading } = useAgentAvailability(
    agentId,
    dateRange || { from: '', to: '' }
  )

  /**
   * Check if agent is available on the task deadline
   */
  const isAvailableOnDeadline = useCallback(() => {
    if (!taskDeadline || !availability) {
      return true // Assume available if no deadline or data not loaded
    }

    const deadlineDate = new Date(taskDeadline)
    const dateStr = deadlineDate.toISOString().split('T')[0]

    // Check blackout periods
    const inBlackout = availability.blackoutPeriods.some(
      (period) => dateStr >= period.startDate && dateStr <= period.endDate
    )

    if (inBlackout) {
      return false
    }

    // Check weekly availability
    const dayOfWeek = getDayOfWeekName(deadlineDate)
    const window = availability.availabilityWindows.find((w) => w.dayOfWeek === dayOfWeek)

    if (!window) {
      return false
    }

    return true
  }, [taskDeadline, availability])

  /**
   * Get a human-readable warning message
   */
  const getAvailabilityWarning = useCallback((): string | null => {
    if (!taskDeadline || !availability) {
      return null
    }

    if (isAvailableOnDeadline()) {
      return null
    }

    const dateStr = taskDeadline
    const dayOfWeek = getDayOfWeekName(new Date(taskDeadline))

    // Check if in blackout
    const blackout = availability.blackoutPeriods.find(
      (period) => dateStr >= period.startDate && dateStr <= period.endDate
    )

    if (blackout) {
      return `Agent is on ${blackout.reason} (${blackout.startDate} to ${blackout.endDate}) on deadline ${dateStr}`
    }

    // Check if day not in availability windows
    const hasWindowOnDay = availability.availabilityWindows.some(
      (w) => w.dayOfWeek === dayOfWeek
    )

    if (!hasWindowOnDay) {
      return `Agent is not scheduled to work on ${dayOfWeek}s. Deadline: ${dateStr}`
    }

    return `Agent is unavailable on deadline ${dateStr}`
  }, [taskDeadline, availability, isAvailableOnDeadline])

  /**
   * Get capacity information
   */
  const getCapacityInfo = useCallback(() => {
    if (!availability) {
      return null
    }

    const { assigned, max } = availability.currentCapacity
    const utilization = Math.round((assigned / max) * 100)

    return {
      assigned,
      max,
      utilization,
      available: assigned < max,
    }
  }, [availability])

  return {
    isAvailableOnDeadline: isAvailableOnDeadline(),
    getAvailabilityWarning,
    getCapacityInfo,
    isLoading,
    hasDeadline: !!taskDeadline,
  }
}

/**
 * Get day of week name from date
 */
function getDayOfWeekName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}
