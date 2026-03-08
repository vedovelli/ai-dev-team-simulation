/**
 * MSW Handlers for Agent Capacity Management
 *
 * Mock API endpoints for agent capacity tracking:
 * - Get all agents with current capacity and workload
 * - Real-time task count tracking per agent
 * - Workload color coding (green/yellow/orange/red)
 */

import { http, HttpResponse } from 'msw'
import type { AgentCapacityData } from '../../hooks/useBulkAssignment'

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
