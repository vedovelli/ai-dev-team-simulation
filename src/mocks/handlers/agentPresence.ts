import { http, HttpResponse } from 'msw'
import type { AgentPresence, AgentPresenceStatus } from '../../types/agent'

/**
 * In-memory store for agent presence state
 * Simulates realistic presence transitions over time
 */
const presenceStore = new Map<
  string,
  {
    presence: AgentPresenceStatus
    lastChangeAt: number
    inactiveSince?: number
  }
>()

/**
 * Initialize presence for demo agents
 */
function initializePresence() {
  const agents = ['CLY5PKWI100000001', 'CLY5PKWI100000002', 'CLY5PKWI100000003']
  const presenceStates: AgentPresenceStatus[] = ['online', 'away', 'offline', 'busy']

  agents.forEach((agentId) => {
    presenceStore.set(agentId, {
      presence: presenceStates[Math.floor(Math.random() * presenceStates.length)],
      lastChangeAt: Date.now(),
    })
  })
}

/**
 * Simulate realistic presence transitions
 * - Online agents can go Away, Busy, or Offline
 * - Away agents can return to Online or go Offline
 * - Offline agents can come back Online or stay offline
 * - Busy agents can return to Online or go Away
 */
function simulatePresenceTransition(
  currentPresence: AgentPresenceStatus
): AgentPresenceStatus {
  const random = Math.random()

  switch (currentPresence) {
    case 'online':
      if (random < 0.1) return 'away' // 10% chance to go away
      if (random < 0.15) return 'busy' // 5% chance to get busy
      if (random < 0.2) return 'offline' // 5% chance to go offline
      return 'online' // 80% stay online

    case 'away':
      if (random < 0.3) return 'online' // 30% return to online
      if (random < 0.4) return 'offline' // 10% go offline
      return 'away' // 60% stay away

    case 'busy':
      if (random < 0.4) return 'online' // 40% finish and return to online
      if (random < 0.5) return 'away' // 10% go away (after finishing)
      return 'busy' // 50% stay busy

    case 'offline':
      if (random < 0.3) return 'online' // 30% come back online
      return 'offline' // 70% stay offline

    default:
      return 'online'
  }
}

/**
 * Get mock agents data to match presence with agent info
 */
function getMockAgents() {
  return [
    { id: 'CLY5PKWI100000001', name: 'Senior Dev 1', role: 'sr-dev' as const },
    { id: 'CLY5PKWI100000002', name: 'Junior Dev 1', role: 'junior' as const },
    { id: 'CLY5PKWI100000003', name: 'Product Manager', role: 'pm' as const },
  ]
}

/**
 * MSW handlers for agent presence
 */
export const agentPresenceHandlers = [
  http.get('/api/agent-presence', () => {
    // Initialize on first request
    if (presenceStore.size === 0) {
      initializePresence()
    }

    // Simulate presence transitions (10% chance on each request)
    presenceStore.forEach((state, agentId) => {
      if (Math.random() < 0.1) {
        const newPresence = simulatePresenceTransition(state.presence)
        presenceStore.set(agentId, {
          presence: newPresence,
          lastChangeAt: Date.now(),
        })
      }
    })

    const agents = getMockAgents()

    const presenceList: AgentPresence[] = agents.map((agent) => {
      const state = presenceStore.get(agent.id)
      if (!state) {
        return {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          presence: 'offline',
          lastSeenAt: new Date().toISOString(),
          statusChangeReason: 'timeout',
        }
      }

      const { presence, lastChangeAt } = state
      const inactiveMinutes = Math.floor((Date.now() - lastChangeAt) / 1000 / 60)

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        presence,
        lastSeenAt: new Date(lastChangeAt).toISOString(),
        statusChangeReason:
          inactiveMinutes > 15 ? 'timeout' : 'user-action',
      }
    })

    return HttpResponse.json({ presence: presenceList })
  }),

  /**
   * Update agent presence (for manual status changes in UI)
   * Example: User clicks "Set as Away" button
   */
  http.put('/api/agent-presence/:agentId', async ({ params, request }) => {
    const { agentId } = params
    const body = await request.json() as { presence: AgentPresenceStatus; reason?: string }

    const state = presenceStore.get(agentId as string)
    if (!state) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    presenceStore.set(agentId as string, {
      presence: body.presence,
      lastChangeAt: Date.now(),
    })

    const agents = getMockAgents()
    const agent = agents.find((a) => a.id === agentId)
    if (!agent) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      presence: body.presence,
      lastSeenAt: new Date().toISOString(),
      statusChangeReason: body.reason || 'manual',
    } as AgentPresence)
  }),

  /**
   * Reset presence data for testing
   */
  http.post('/api/agent-presence/reset', () => {
    presenceStore.clear()
    initializePresence()

    const agents = getMockAgents()
    const presenceList: AgentPresence[] = agents.map((agent) => {
      const state = presenceStore.get(agent.id)!
      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        presence: state.presence,
        lastSeenAt: new Date(state.lastChangeAt).toISOString(),
        statusChangeReason: 'user-action',
      }
    })

    return HttpResponse.json({ presence: presenceList })
  }),
]
