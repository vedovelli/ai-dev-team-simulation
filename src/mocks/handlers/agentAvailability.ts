/**
 * MSW Handlers for Agent Availability Calendar
 *
 * Mock API endpoints for agent availability tracking:
 * - Get daily availability for a specific agent and month
 * - Returns availability status, task counts, and conflict information
 * - Conflict detection when tasks are scheduled on unavailable days
 */

import { http, HttpResponse } from 'msw'
import type { AgentCalendarAvailability, DailyAvailability } from '../../types/agent'

/**
 * Generate realistic daily availability data for a month
 * Simulates weekday/weekend patterns and varying task loads
 */
function generateMonthlyAvailability(
  agentId: string,
  month: number,
  year: number
): AgentCalendarAvailability {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  const dailyAvailability: DailyAvailability[] = []

  for (let d = 1; d <= endDate.getDate(); d++) {
    const date = new Date(year, month - 1, d)
    const dayOfWeek = date.getDay()
    const dateStr = date.toISOString().split('T')[0]

    // Weekends have variable availability
    let availabilityStatus: 'available' | 'unavailable' | 'partial'
    let tasksScheduled = 0
    let hasConflict = false
    let conflictReason: string | undefined

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekends: usually unavailable or with fewer tasks
      const rand = Math.random()
      if (rand < 0.7) {
        availabilityStatus = 'unavailable'
      } else {
        availabilityStatus = 'partial'
        tasksScheduled = Math.floor(Math.random() * 2) // 0-1 task
      }
    } else {
      // Weekdays: mostly available with some unavailable days
      const rand = Math.random()
      if (rand < 0.85) {
        availabilityStatus = 'available'
        tasksScheduled = Math.floor(Math.random() * 5) // 0-4 tasks
      } else if (rand < 0.95) {
        availabilityStatus = 'partial'
        tasksScheduled = Math.floor(Math.random() * 3) + 1 // 1-3 tasks
      } else {
        availabilityStatus = 'unavailable'
        tasksScheduled = Math.floor(Math.random() * 3) // 0-2 tasks
      }
    }

    // Conflict: tasks scheduled on unavailable days
    if (availabilityStatus === 'unavailable' && tasksScheduled > 0) {
      hasConflict = true
      conflictReason = `${tasksScheduled} task${tasksScheduled > 1 ? 's' : ''} on unavailable day`
    } else if (availabilityStatus === 'partial' && tasksScheduled > 2) {
      hasConflict = true
      conflictReason = `${tasksScheduled} tasks scheduled, limited availability`
    }

    dailyAvailability.push({
      date: dateStr,
      agentId,
      availabilityStatus,
      tasksScheduled,
      hasConflict,
      conflictReason,
    })
  }

  return {
    agentId,
    agentName: `Agent ${agentId}`,
    month,
    year,
    dailyAvailability,
  }
}

export const agentAvailabilityHandlers = [
  // Get agent availability for a specific month
  http.get('/api/agents/:agentId/availability', ({ params, request }) => {
    const { agentId } = params
    const url = new URL(request.url)
    const month = parseInt(url.searchParams.get('month') || '1', 10)
    const year = parseInt(url.searchParams.get('year') || '2026', 10)

    const availability = generateMonthlyAvailability(agentId as string, month, year)

    return HttpResponse.json(availability, { status: 200 })
  }),
]
