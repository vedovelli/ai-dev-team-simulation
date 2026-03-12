/**
 * MSW Handlers for Agent Capacity Management
 *
 * Mock API endpoints for agent capacity tracking:
 * - Get all agents with current capacity and workload
 * - Real-time task count tracking per agent
 * - Workload color coding (green/yellow/orange/red)
 * - Sprint-specific capacity metrics with warning levels
 * - Capacity adjustment (PATCH)
 */

import { http, HttpResponse } from 'msw'
import type { AgentCapacityData } from '../../hooks/useBulkAssignment'
import type {
  AgentCapacityMetric,
  AgentCapacityMetricsResponse,
  WarningLevel,
} from '../../types/capacity'

/**
 * Mock data generator for agent capacity
 * Creates realistic distribution of agent workloads
 */
function generateAgentCapacityData(): Record<string, AgentCapacityData> {
  const agents = [
    'agent-1',
    'agent-2',
    'agent-3',
    'agent-4',
    'agent-5',
    'agent-6',
    'agent-7',
    'agent-8',
  ]

  const agentNames = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry',
  ]

  const capacityMap: Record<string, AgentCapacityData> = {}

  agents.forEach((agentId, index) => {
    const currentTasks = Math.floor(Math.random() * 11) // 0-10 tasks
    const maxTasks = 10
    const utilization = (currentTasks / maxTasks) * 100

    let workload: AgentCapacityData['workload']
    if (utilization <= 40) {
      workload = 'low'
    } else if (utilization <= 70) {
      workload = 'medium'
    } else if (utilization <= 99) {
      workload = 'high'
    } else {
      workload = 'overloaded'
    }

    capacityMap[agentId] = {
      agentId,
      name: agentNames[index],
      currentTasks,
      maxTasks,
      workload,
    }
  })

  return capacityMap
}

/**
 * Mock data generator for agent capacity metrics with warning levels
 * Generates 10-50 agents with varied utilization levels
 */
function generateAgentCapacityMetrics(
  sprintId: string
): AgentCapacityMetricsResponse {
  const agentCount = 15 + Math.floor(Math.random() * 36) // 15-50 agents
  const agentNames = [
    'Alice Chen',
    'Bob Rodriguez',
    'Charlie Williams',
    'Diana Prince',
    'Eve Martinez',
    'Frank Thompson',
    'Grace Lee',
    'Henry Jackson',
    'Ivy Kim',
    'Jack Anderson',
    'Kara Davis',
    'Leo Wilson',
    'Maya Patel',
    'Noah Brown',
    'Olivia Moore',
    'Paul Taylor',
    'Quinn White',
    'Ruby Harris',
    'Sam Martin',
    'Tara Johnson',
    'Uma Singh',
    'Victor Lopez',
    'Wendy Garcia',
    'Xavier Martinez',
    'Yara Ahmed',
    'Zoe Miller',
  ]

  const agents: AgentCapacityMetric[] = []

  for (let i = 0; i < agentCount; i++) {
    const maxCapacity = 10 + Math.floor(Math.random() * 11) // 10-20
    const currentLoad = Math.floor(Math.random() * (maxCapacity + 1))
    const utilizationPct = Math.round((currentLoad / maxCapacity) * 100)

    let warningLevel: WarningLevel
    if (utilizationPct > 95) {
      warningLevel = 'critical'
    } else if (utilizationPct > 80) {
      warningLevel = 'warning'
    } else {
      warningLevel = 'ok'
    }

    agents.push({
      agentId: `agent-${i + 1}`,
      name: agentNames[i % agentNames.length],
      currentLoad,
      maxCapacity,
      tasksAssigned: currentLoad,
      utilizationPct,
      warningLevel,
    })
  }

  return {
    agents,
    timestamp: new Date().toISOString(),
    sprintId,
  }
}

// Store for capacity adjustments (for optimistic updates)
const capacityStore: Record<
  string,
  Record<string, number>
> = {}

// Cache capacity data with TTL
let cachedCapacity = generateAgentCapacityData()
let lastGeneratedAt = Date.now()
const CAPACITY_CACHE_TTL = 10000 // 10 seconds

function getUpdatedCapacityData(): Record<string, AgentCapacityData> {
  const now = Date.now()
  if (now - lastGeneratedAt > CAPACITY_CACHE_TTL) {
    cachedCapacity = generateAgentCapacityData()
    lastGeneratedAt = now
  }
  return cachedCapacity
}

export const agentCapacityHandlers = [
  /**
   * GET /api/agents/capacity
   * Get all agents with their current capacity and workload
   */
  http.get('/api/agents/capacity', () => {
    const capacityData = getUpdatedCapacityData()
    return HttpResponse.json(
      {
        success: true,
        data: capacityData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  /**
   * GET /api/agents/capacity?sprintId=:id
   * Get agent capacity metrics for a specific sprint with warning levels
   */
  http.get('/api/agents/capacity', ({ request }) => {
    const url = new URL(request.url)
    const sprintId = url.searchParams.get('sprintId')

    if (!sprintId) {
      return HttpResponse.json(
        { error: 'sprintId is required' },
        { status: 400 }
      )
    }

    const metricsData = generateAgentCapacityMetrics(sprintId)
    return HttpResponse.json(metricsData, { status: 200 })
  }),

  /**
   * GET /api/agents/:id/capacity
   * Get capacity info for a specific agent
   */
  http.get('/api/agents/:id/capacity', ({ params }) => {
    const { id } = params
    const capacityData = getUpdatedCapacityData()
    const agentCapacity = capacityData[id as string]

    if (!agentCapacity) {
      return HttpResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(agentCapacity, { status: 200 })
  }),

  /**
   * PATCH /api/agents/:id/capacity
   * Adjust an agent's maximum capacity
   */
  http.patch('/api/agents/:id/capacity', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as { newMaxCapacity: number }

    if (!body.newMaxCapacity || body.newMaxCapacity < 1) {
      return HttpResponse.json(
        { error: 'newMaxCapacity must be at least 1' },
        { status: 400 }
      )
    }

    const agentId = id as string
    const previousCapacity = capacityStore[agentId] ?? 10

    // Store the adjustment
    if (!capacityStore[agentId]) {
      capacityStore[agentId] = previousCapacity
    }
    capacityStore[agentId] = body.newMaxCapacity

    return HttpResponse.json(
      {
        agentId,
        previousCapacity,
        newCapacity: body.newMaxCapacity,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  }),

  /**
   * GET /api/agents/availability
   * Get availability data for all agents (used by useTaskAssignment)
   */
  http.get('/api/agents/availability', () => {
    const capacityData = getUpdatedCapacityData()

    // Convert to compatibility format for useTaskAssignment hook
    const availabilityData = Object.entries(capacityData).reduce(
      (acc, [agentId, capacity]) => {
        acc[agentId] = {
          agentId,
          currentTasks: capacity.currentTasks,
          maxTasks: capacity.maxTasks,
          available: capacity.workload !== 'overloaded',
          workload: capacity.workload,
        }
        return acc
      },
      {} as Record<string, any>
    )

    return HttpResponse.json(
      {
        success: true,
        data: availabilityData,
      },
      { status: 200 }
    )
  }),
]
