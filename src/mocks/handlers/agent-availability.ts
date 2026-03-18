import { http, HttpResponse } from 'msw'
import type { AgentAvailabilityStatus } from '../../types/agent'
import type { AgentAvailability as ScheduledAvailability, DayOfWeek } from '../../types/agent-availability'

/**
 * In-memory store for agent availability status
 * Simulates real-time agent availability tracking
 */
const availabilityStore = new Map<
  string,
  {
    status: AgentAvailabilityStatus
    lastSeen: string
    currentTaskCount: number
    changedAt: number
  }
>()

/**
 * Initialize availability for demo agents
 */
function initializeAvailability() {
  const agents = ['CLY5PKWI100000001', 'CLY5PKWI100000002', 'CLY5PKWI100000003']
  const statusStates: AgentAvailabilityStatus[] = ['online', 'busy', 'offline']

  agents.forEach((agentId) => {
    const status = statusStates[Math.floor(Math.random() * statusStates.length)]
    availabilityStore.set(agentId, {
      status,
      lastSeen: new Date().toISOString(),
      currentTaskCount: status === 'online' ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 5),
      changedAt: Date.now(),
    })
  })
}

/**
 * Simulate realistic availability transitions
 * - Online agents can become busy or go offline
 * - Busy agents can go back online or offline
 * - Offline agents can come back online
 */
function simulateAvailabilityTransition(
  currentStatus: AgentAvailabilityStatus
): AgentAvailabilityStatus {
  const random = Math.random()

  switch (currentStatus) {
    case 'online':
      if (random < 0.15) return 'busy' // 15% chance to become busy
      if (random < 0.05) return 'offline' // 5% chance to go offline
      return 'online' // 80% stay online

    case 'busy':
      if (random < 0.2) return 'online' // 20% chance to finish and go back online
      if (random < 0.1) return 'offline' // 10% chance to go offline
      return 'busy' // 70% stay busy

    case 'offline':
      if (random < 0.25) return 'online' // 25% chance to come back online
      return 'offline' // 75% stay offline

    default:
      return 'online'
  }
}

/**
 * Get mock agents data to match availability with agent info
 */
function getMockAgents() {
  return [
    { id: 'CLY5PKWI100000001', name: 'Senior Dev 1', role: 'sr-dev' as const },
    { id: 'CLY5PKWI100000002', name: 'Junior Dev 1', role: 'junior' as const },
    { id: 'CLY5PKWI100000003', name: 'Product Manager', role: 'pm' as const },
  ]
}

/**
 * Mock data generator for scheduled agent availability
 * Creates realistic availability patterns with standard work hours and blackout periods
 */
function generateScheduledAvailability(agentId: string): ScheduledAvailability {
  const agentIndex = parseInt(agentId.split('-')[1] || '0', 10)

  // Standard work hours: Mon-Fri 9am-5pm
  const availabilityWindows: ScheduledAvailability['availabilityWindows'] = [
    { dayOfWeek: 'monday', startHour: 9, endHour: 17 },
    { dayOfWeek: 'tuesday', startHour: 9, endHour: 17 },
    { dayOfWeek: 'wednesday', startHour: 9, endHour: 17 },
    { dayOfWeek: 'thursday', startHour: 9, endHour: 17 },
    { dayOfWeek: 'friday', startHour: 9, endHour: 17 },
    // Some agents work weekends
    ...(agentIndex % 4 === 0 ? [{ dayOfWeek: 'saturday' as DayOfWeek, startHour: 10, endHour: 14 }] : []),
  ]

  // Generate some blackout periods
  const today = new Date()
  const blackoutPeriods: ScheduledAvailability['blackoutPeriods'] = []

  // Add vacation periods for some agents
  if (agentIndex % 3 === 0) {
    const vacationStart = new Date(today)
    vacationStart.setDate(vacationStart.getDate() + 10)
    const vacationEnd = new Date(vacationStart)
    vacationEnd.setDate(vacationEnd.getDate() + 5)

    blackoutPeriods.push({
      startDate: vacationStart.toISOString().split('T')[0],
      endDate: vacationEnd.toISOString().split('T')[0],
      reason: 'Vacation',
    })
  }

  // Add occasional sick leave
  if (agentIndex % 5 === 1) {
    const sickStart = new Date(today)
    sickStart.setDate(sickStart.getDate() + 3)
    const sickEnd = new Date(sickStart)
    sickEnd.setDate(sickEnd.getDate() + 1)

    blackoutPeriods.push({
      startDate: sickStart.toISOString().split('T')[0],
      endDate: sickEnd.toISOString().split('T')[0],
      reason: 'Sick leave',
    })
  }

  return {
    agentId,
    availabilityWindows,
    blackoutPeriods,
    currentCapacity: {
      assigned: Math.floor(Math.random() * 8), // 0-7 tasks
      max: 10,
    },
  }
}

/**
 * Check if a date falls within a blackout period
 */
function isInBlackoutPeriod(
  date: Date,
  blackoutPeriods: ScheduledAvailability['blackoutPeriods']
): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return blackoutPeriods.some(
    (period) => dateStr >= period.startDate && dateStr <= period.endDate
  )
}

/**
 * Get day of week name
 */
function getDayOfWeekName(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return days[date.getDay()]
}

/**
 * Check if agent is available at a specific time
 */
function isAvailableAt(
  date: Date,
  availability: ScheduledAvailability
): boolean {
  // Check if in blackout period
  if (isInBlackoutPeriod(date, availability.blackoutPeriods)) {
    return false
  }

  // Check weekly availability window
  const dayOfWeek = getDayOfWeekName(date)
  const window = availability.availabilityWindows.find(
    (w) => w.dayOfWeek === dayOfWeek
  )

  if (!window) {
    return false // Not available this day of week
  }

  // Check if time is within window
  const hour = date.getHours()
  return hour >= window.startHour && hour < window.endHour
}

/**
 * MSW handlers for agent real-time availability status
 */
export const agentAvailabilityStatusHandlers = [
  /**
   * GET /api/agents/status
   * Returns real-time availability status for all agents
   */
  http.get('/api/agents/status', () => {
    // Initialize on first request
    if (availabilityStore.size === 0) {
      initializeAvailability()
    }

    // Simulate availability transitions (10% chance on each request)
    availabilityStore.forEach((state, agentId) => {
      if (Math.random() < 0.1) {
        const newStatus = simulateAvailabilityTransition(state.status)
        availabilityStore.set(agentId, {
          ...state,
          status: newStatus,
          changedAt: Date.now(),
        })
      }
    })

    const agents = getMockAgents()

    const agentStatuses = agents.map((agent) => {
      const state = availabilityStore.get(agent.id)
      if (!state) {
        return {
          id: agent.id,
          name: agent.name,
          status: 'offline' as const,
          lastSeen: new Date().toISOString(),
          currentTaskCount: 0,
        }
      }

      return {
        id: agent.id,
        name: agent.name,
        status: state.status,
        lastSeen: state.lastSeen,
        currentTaskCount: state.currentTaskCount,
      }
    })

    return HttpResponse.json({ agents: agentStatuses })
  }),

  /**
   * PATCH /api/agents/status
   * Update availability status for current user (manual toggle for testing)
   */
  http.patch('/api/agents/status', async ({ request }) => {
    const body = (await request.json()) as { status: AgentAvailabilityStatus }

    // For demo purposes, update the first agent
    const currentAgentId = 'CLY5PKWI100000001'
    const state = availabilityStore.get(currentAgentId)

    if (!state) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    availabilityStore.set(currentAgentId, {
      ...state,
      status: body.status,
      changedAt: Date.now(),
    })

    const agents = getMockAgents()
    const agent = agents.find((a) => a.id === currentAgentId)
    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      id: agent.id,
      name: agent.name,
      status: body.status,
      lastSeen: new Date().toISOString(),
      currentTaskCount: state.currentTaskCount,
    })
  }),

  /**
   * POST /api/agents/status/reset
   * Reset availability data for testing
   */
  http.post('/api/agents/status/reset', () => {
    availabilityStore.clear()
    initializeAvailability()

    const agents = getMockAgents()
    const agentStatuses = agents.map((agent) => {
      const state = availabilityStore.get(agent.id)!
      return {
        id: agent.id,
        name: agent.name,
        status: state.status,
        lastSeen: new Date(state.changedAt).toISOString(),
        currentTaskCount: state.currentTaskCount,
      }
    })

    return HttpResponse.json({ agents: agentStatuses })
  }),

  /**
   * GET /api/agents/:id/availability?from=...&to=...
   * Get agent scheduled availability with date range filtering
   * Query params:
   * - from: ISO date string (inclusive)
   * - to: ISO date string (inclusive)
   */
  http.get('/api/agents/:id/availability', ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    if (!from || !to) {
      return HttpResponse.json(
        { error: 'from and to query parameters are required (ISO date format)' },
        { status: 400 }
      )
    }

    try {
      // Validate date format
      const fromDate = new Date(from)
      const toDate = new Date(to)

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return HttpResponse.json(
          { error: 'Invalid date format. Use ISO date format (YYYY-MM-DD)' },
          { status: 400 }
        )
      }

      const agentId = id as string
      const availability = generateScheduledAvailability(agentId)

      // Return the complete availability object
      // The client-side hook will use isAvailable() helper to check specific dates
      return HttpResponse.json(availability, { status: 200 })
    } catch (error) {
      return HttpResponse.json(
        { error: 'Failed to process date range' },
        { status: 400 }
      )
    }
  }),
]

/**
 * Export utility function for checking availability (can be used in tests)
 */
export { isAvailableAt }
