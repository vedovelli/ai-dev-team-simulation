/**
 * MSW Handlers for Agent Availability
 *
 * Mock API endpoints for agent availability calendar:
 * - GET /api/agents/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   Returns availability slots for a date range with realistic patterns
 * - POST /api/agents/:id/availability (future sprint feature)
 */

import { http, HttpResponse } from 'msw'
import type { AvailabilitySlot } from '../../types/agentAvailability'

/**
 * PTO dates for various agents (mock data)
 */
const AGENT_PTO: Record<string, string[]> = {
  'agent-1': ['2026-03-17', '2026-03-18', '2026-03-19'],
  'agent-2': ['2026-03-20'],
  'agent-3': ['2026-03-17', '2026-03-18'],
  'agent-4': [],
  'agent-5': ['2026-03-25', '2026-03-26', '2026-03-27'],
}

/**
 * Generate availability data for an agent within a date range
 *
 * Patterns:
 * - Weekends (Sat/Sun) are off
 * - Specific PTO dates are off
 * - Task counts vary: 0-3 on off days, 1-5 on available days
 */
function generateAvailabilitySlots(
  agentId: string,
  fromDate: string,
  toDate: string
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []

  const from = new Date(fromDate)
  const to = new Date(toDate)

  const ptoList = AGENT_PTO[agentId] ?? []

  // Iterate through each day in the range
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayOfWeek = d.getDay()

    // Check if it's a weekend (0 = Sunday, 6 = Saturday)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Check if it's a PTO date
    const isPto = ptoList.includes(dateStr)

    const isAvailable = !isWeekend && !isPto

    // Generate task count
    let taskCount: number
    if (!isAvailable) {
      // Off days have 0 tasks
      taskCount = 0
    } else {
      // Available days: 1-5 tasks
      taskCount = Math.floor(Math.random() * 5) + 1
    }

    const slot: AvailabilitySlot = {
      date: dateStr,
      isAvailable,
      taskCount,
    }

    // Add reason for unavailability
    if (isWeekend) {
      slot.reason = 'Weekend'
    } else if (isPto) {
      slot.reason = 'PTO'
    }

    slots.push(slot)
  }

  return slots
}

/**
 * Parse and validate date strings
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Validate date range (from must be before to)
 */
function isValidDateRange(from: Date, to: Date): boolean {
  return from < to
}

export const agentAvailabilityHandlers = [
  /**
   * GET /api/agents/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Returns availability slots for the agent within the date range
   */
  http.get('/api/agents/:id/availability', ({ request, params }) => {
    const { id } = params
    const agentId = id as string

    const url = new URL(request.url)
    const fromParam = url.searchParams.get('from')
    const toParam = url.searchParams.get('to')

    // Validate required parameters
    if (!fromParam || !toParam) {
      return HttpResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      )
    }

    // Parse and validate dates
    const from = parseDate(fromParam)
    const to = parseDate(toParam)

    if (!from || !to) {
      return HttpResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    if (!isValidDateRange(from, to)) {
      return HttpResponse.json(
        { error: 'Invalid date range: from must be before to' },
        { status: 400 }
      )
    }

    // Generate availability slots
    const slots = generateAvailabilitySlots(agentId, fromParam, toParam)

    return HttpResponse.json(slots, { status: 200 })
  }),

  /**
   * POST /api/agents/:id/availability (future sprint feature)
   * Mark agent as unavailable for a date range
   */
  http.post('/api/agents/:id/availability', async ({ params, request }) => {
    const { id } = params
    const agentId = id as string

    const body = await request.json() as {
      date: string
      reason: string
    }

    if (!body.date || !body.reason) {
      return HttpResponse.json(
        { error: 'Missing required fields: date, reason' },
        { status: 400 }
      )
    }

    // Validate date format
    if (!parseDate(body.date)) {
      return HttpResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    return HttpResponse.json(
      {
        agentId,
        date: body.date,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),
]
