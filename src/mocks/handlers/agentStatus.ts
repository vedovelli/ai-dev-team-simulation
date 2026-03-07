/**
 * MSW Handlers for Agent Status & Availability System
 *
 * Mock API endpoints for real-time agent status monitoring.
 * Provides realistic state transitions and availability tracking.
 */

import { http, HttpResponse } from 'msw'
import type { AgentAvailability } from '../../types/agent'
import type { AgentRole, AgentAvailabilityStatus } from '../../types/agent'

/**
 * In-memory store for agent states to maintain consistency across requests
 * In a real application, this would be persisted in a database
 */
const agentStates = new Map<
  string,
  {
    status: AgentAvailabilityStatus
    lastTransitionTime: Date
  }
>()

/**
 * Generate realistic state transitions
 * Agents cycle through states: idle -> active -> busy -> idle, etc.
 */
function getNextStatus(
  currentStatus: AgentAvailabilityStatus,
  agentId: string
): AgentAvailabilityStatus {
  // Get time-based randomness for state transitions
  const now = new Date()
  const minutesSinceLastTransition = agentId
    ? (now.getTime() - (agentStates.get(agentId)?.lastTransitionTime?.getTime() || 0)) / 60000
    : 0

  // Transition states approximately every 30 seconds
  if (minutesSinceLastTransition > 0.5) {
    const transitions: Record<AgentAvailabilityStatus, AgentAvailabilityStatus[]> = {
      idle: ['active', 'offline'],
      active: ['busy', 'idle'],
      busy: ['active', 'idle'],
      offline: ['idle', 'active'],
    }

    const possibleNextStates = transitions[currentStatus] || ['idle']
    const randomIndex = Math.floor(Math.random() * possibleNextStates.length)
    return possibleNextStates[randomIndex]
  }

  return currentStatus
}

/**
 * Generate mock agent availability data
 */
function generateAgentAvailability(agentId: string): AgentAvailability {
  const agents: Record<
    string,
    {
      name: string
      role: AgentRole
      capabilities: string[]
    }
  > = {
    'agent-sr-dev': {
      name: 'Senior Dev Agent',
      role: 'sr-dev',
      capabilities: ['architecture', 'code-review', 'refactoring'],
    },
    'agent-junior': {
      name: 'Junior Dev Agent',
      role: 'junior',
      capabilities: ['bug-fixes', 'feature-implementation', 'testing'],
    },
    'agent-pm': {
      name: 'Project Manager Agent',
      role: 'pm',
      capabilities: ['planning', 'task-distribution', 'reporting'],
    },
  }

  const agentInfo = agents[agentId] || agents['agent-sr-dev']
  const lastState = agentStates.get(agentId)
  let currentStatus = lastState?.status || 'idle'

  // Update state transitions
  currentStatus = getNextStatus(currentStatus, agentId)
  agentStates.set(agentId, {
    status: currentStatus,
    lastTransitionTime: new Date(),
  })

  // Determine task allocation based on status
  const tasksInProgress = currentStatus === 'busy' ? Math.floor(Math.random() * 3) + 1 : currentStatus === 'active' ? 1 : 0
  const tasksCompleted = Math.floor(Math.random() * 50) + 10

  return {
    id: agentId,
    name: agentInfo.name,
    role: agentInfo.role,
    status: currentStatus,
    statusChangedAt: new Date(lastState?.lastTransitionTime || Date.now()).toISOString(),
    currentTaskId: currentStatus !== 'idle' ? `task-${Math.floor(Math.random() * 1000)}` : undefined,
    capabilities: agentInfo.capabilities,
    metadata: {
      lastActivityAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 60 * 1000)).toISOString(),
      tasksCompleted,
      tasksInProgress,
      errorRate: Math.floor(Math.random() * 5),
    },
  }
}

export const agentStatusHandlers = [
  /**
   * GET /api/agents/:id/status
   * Fetch current agent status and availability
   */
  http.get('/api/agents/:id/status', ({ params }) => {
    const { id } = params
    const agentId = String(id)

    // Simulate occasional network errors (5% chance)
    if (Math.random() < 0.05) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    const availability = generateAgentAvailability(agentId)

    return HttpResponse.json(availability, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }),
]
