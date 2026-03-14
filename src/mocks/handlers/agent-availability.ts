import { http, HttpResponse } from 'msw'
import type { AgentAvailabilityStatus } from '../../types/agent'

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
]
